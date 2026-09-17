import {
  DartBlockedError,
  fetchListedCorpCodes,
  fetchStatements,
  readDartKey,
  type FinancialStatementBasis,
} from "@/lib/dart/client";
import { pickAccounts, type DartAccountRow } from "@/lib/dart/response";
import {
  FSC_ENDPOINT,
  fetchFsc,
  fetchFscAllPages,
  readFscKey,
} from "@/lib/fsc/client";
import {
  pickLatestByBasDt,
  pickPreferredStatement,
  type StatementBasis,
} from "@/lib/fsc/response";
import {
  accrualRatio,
  earningsQuality,
  fcfYield,
  freeCashFlow,
} from "@/lib/metrics/cashflow";
import { anomalyFlags, type AnomalyFlag } from "@/lib/metrics/flags";
import {
  dupont,
  effectiveTaxRate,
  investedCapital,
  roic,
} from "@/lib/metrics/quality";
import { combinedRank, percentileRanks } from "@/lib/metrics/ranking";
import { altmanZ, workingCapital } from "@/lib/metrics/risk";
import {
  enterpriseValue,
  evToEbit,
  ncavMultiple,
  pbr,
  per,
} from "@/lib/metrics/valuation";

export type SnapshotItem = {
  stockCode: string;
  corpCode: string;
  crno: string;
  name: string;
  market: string;
  marketCap: number;
  per: number | null;
  pbr: number | null;
  evToEbit: number | null;
  roic: number | null;
  fcfYield: number | null;
  accrualRatio: number | null;
  earningsQuality: number | null;
  ncavMultiple: number | null;
  netMargin: number | null;
  assetTurnover: number | null;
  leverage: number | null;
  effectiveTaxRate: number | null;
  altmanZ: number | null;
  percentile: {
    evToEbit: number;
    roic: number;
    fcfYield: number;
    altmanZ: number;
  } | null;
  rank: number | null;
  rankScore: number | null;
  flags: AnomalyFlag[];
  /** 순위에서 빠진 경우 그 사유. 순위에 든 종목은 null이다. */
  excludedReason: string | null;
  basis: { fsc: StatementBasis | null; dart: FinancialStatementBasis | null };
};

export type Snapshot = {
  generatedAt: string;
  bizYear: number;
  priceBasDt: string;
  listedBasDt: string;
  coverage: {
    listed: number;
    dartMapped: number;
    fscJoined: number;
    statementsFetched: number;
    statementsRetriedAsSeparate: number;
    metricsComplete: number;
  };
  items: SnapshotItem[];
};

export type Progress = (message: string) => void;

/**
 * 이미 받아 둔 종목별 재무제표.
 *
 * 계정을 뽑아낸 결과가 아니라 원본 계정 목록을 저장한다. 지표 계산 방식이
 * 바뀌어도 다시 받지 않고 캐시에서 새로 뽑아낼 수 있어야 하기 때문이다.
 */
export type StatementCache = Map<
  string,
  { basis: FinancialStatementBasis; list: DartAccountRow[] }
>;

/**
 * 종목 단위 조회의 동시 실행 수.
 *
 * 8로 두었을 때 2,756종목을 돌리는 중간에 IP 단위 차단을 받았다. 요청 간격과
 * 함께 낮게 잡는다.
 */
const CONCURRENCY = 2;

/**
 * 연속으로 이만큼 연결이 끊기면 차단으로 보고 멈춘다.
 *
 * 차단된 상태에서 남은 종목을 계속 두드려도 얻는 것이 없고, 차단만 길어진다.
 */
const CONSECUTIVE_FAILURES_UNTIL_BLOCKED = 10;

export async function buildSnapshot(
  bizYear: number,
  log: Progress = () => {},
  cache: StatementCache = new Map(),
): Promise<Snapshot> {
  const fscKey = readFscKey();
  const dartKey = readDartKey();

  log("상장 종목 목록을 받는 중…");
  const listedBasDt = await findLatestBasDt(FSC_ENDPOINT.listedItems, fscKey);
  const listed = await fetchAllOrThrow<KrxItem>(
    "KRX상장종목정보",
    FSC_ENDPOINT.listedItems,
    { basDt: listedBasDt },
    fscKey,
  );
  const listedLatest = dedupeLatest(listed, (r) => r.srtnCd ?? "");
  log(`  상장 종목 ${listedLatest.length}곳 (기준일 ${listedBasDt})`);

  log("OpenDART 고유번호를 받는 중…");
  const corpCodes = await fetchListedCorpCodes(dartKey);
  if ("error" in corpCodes) {
    throw new Error(`OpenDART 고유번호 조회 실패: ${corpCodes.error}`);
  }
  const corpCodeByStock = new Map(
    corpCodes.entries.map((e) => [e.stockCode, e.corpCode]),
  );
  log(`  종목코드를 가진 기업 ${corpCodeByStock.size}곳`);

  log("시세를 받는 중…");
  const priceBasDt = await findLatestBasDt(FSC_ENDPOINT.stockPrice, fscKey);
  const prices = await fetchAllOrThrow<PriceRow>(
    "주식시세정보",
    FSC_ENDPOINT.stockPrice,
    { basDt: priceBasDt },
    fscKey,
  );
  const priceByIsin = new Map(prices.map((p) => [p.isinCd ?? "", p]));
  log(`  시세 ${prices.length}건 (기준일 ${priceBasDt})`);

  log(`요약재무제표를 받는 중 (${bizYear}, ${bizYear - 1})…`);
  const summaryNow = await fetchAllOrThrow<SummaryRow>(
    "기업재무정보",
    FSC_ENDPOINT.summaryFinancials,
    { bizYear },
    fscKey,
    log,
  );
  const summaryPrev = await fetchAllOrThrow<SummaryRow>(
    "기업재무정보",
    FSC_ENDPOINT.summaryFinancials,
    { bizYear: bizYear - 1 },
    fscKey,
    log,
  );

  log(`재무상태표를 받는 중 (${bizYear})…`);
  const balance = await fetchAllOrThrow<BalanceRow>(
    "기업재무정보",
    FSC_ENDPOINT.balanceSheet,
    { bizYear },
    fscKey,
    log,
  );

  const summaryByCrno = groupBy(summaryNow, (r) => r.crno ?? "");
  const prevByCrno = groupBy(summaryPrev, (r) => r.crno ?? "");
  const balanceByCrno = groupBy(balance, (r) => r.crno ?? "");

  const cachedAtStart = cache.size;
  log(
    `OpenDART 재무제표를 받는 중 (${listedLatest.length}종목` +
      (cachedAtStart > 0 ? `, 이미 받아 둔 ${cachedAtStart}곳은 건너뜀` : "") +
      ")…",
  );
  let consecutiveNetworkFailures = 0;
  const statements = await mapWithLimit(
    listedLatest,
    CONCURRENCY,
    async (item) => {
      const stockCode = (item.srtnCd ?? "").replace(/^A/, "");
      const corpCode = corpCodeByStock.get(stockCode);
      if (!corpCode) return null;

      const cached = cache.get(corpCode);
      if (cached) return cached;

      for (const basis of ["CFS", "OFS"] as const) {
        const r = await fetchStatements(corpCode, bizYear, basis, dartKey);
        if (r.ok) {
          consecutiveNetworkFailures = 0;
          const entry = { basis, list: r.list };
          cache.set(corpCode, entry);
          return entry;
        }
        // 010/011은 키 문제이므로 다시 시도해도 소용이 없다.
        if (r.code === "010" || r.code === "011") {
          throw new Error(`OpenDART 인증 실패: [${r.code}] ${r.reason}`);
        }
        if (r.code === "NETWORK") {
          if (++consecutiveNetworkFailures >= CONSECUTIVE_FAILURES_UNTIL_BLOCKED) {
            throw new DartBlockedError(r.reason);
          }
          return null;
        }
        // 013은 연결재무제표가 없다는 뜻이므로 개별로 넘어간다.
        consecutiveNetworkFailures = 0;
      }
      return null;
    },
    (done) => {
      if (done % 250 === 0) log(`  ${done}/${listedLatest.length}`);
    },
  );

  const fetched = statements.filter((s) => s !== null).length;
  const retried = statements.filter((s) => s?.basis === "OFS").length;
  log(`  확보 ${fetched}곳 (개별로 재시도해 얻은 곳 ${retried})`);

  const rows: SnapshotItem[] = [];
  let dartMapped = 0;
  let fscJoined = 0;

  for (let i = 0; i < listedLatest.length; i++) {
    const item = listedLatest[i];
    const stmt = statements[i];
    const stockCode = (item.srtnCd ?? "").replace(/^A/, "");
    const corpCode = corpCodeByStock.get(stockCode);
    if (corpCode) dartMapped++;

    const crno = item.crno ?? "";
    const price = priceByIsin.get(item.isinCd ?? "");
    const summary = pickPreferredStatement(summaryByCrno.get(crno) ?? []);
    if (!price || !summary) continue;
    fscJoined++;

    rows.push(
      toSnapshotItem({
        item,
        stockCode,
        corpCode: corpCode ?? "",
        price,
        summary,
        balance: balanceByCrno.get(crno) ?? [],
        previous: pickPreferredStatement(prevByCrno.get(crno) ?? []),
        accounts: stmt ? pickAccounts(stmt.list) : null,
        dartBasis: stmt?.basis ?? null,
      }),
    );
  }

  assignPercentilesAndRanks(rows);

  const snapshot: Snapshot = {
    generatedAt: new Date().toISOString(),
    bizYear,
    priceBasDt,
    listedBasDt,
    coverage: {
      listed: listedLatest.length,
      dartMapped,
      fscJoined,
      statementsFetched: fetched,
      statementsRetriedAsSeparate: retried,
      metricsComplete: rows.filter((r) => r.percentile !== null).length,
    },
    items: rows,
  };

  return snapshot;
}

// ---------------------------------------------------------------- 원천 행 타입

type KrxItem = {
  basDt?: string;
  srtnCd?: string;
  isinCd?: string;
  itmsNm?: string;
  mrktCtg?: string;
  crno?: string;
  corpNm?: string;
};

type PriceRow = { isinCd?: string; mrktTotAmt?: string; clpr?: string };

type SummaryRow = {
  crno?: string;
  fnclDcdNm?: string;
  enpSaleAmt?: string;
  enpBzopPft?: string;
  iclsPalClcAmt?: string;
  enpCrtmNpf?: string;
  enpTastAmt?: string;
  enpTdbtAmt?: string;
  enpTcptAmt?: string;
};

type BalanceRow = {
  crno?: string;
  fnclDcdNm?: string;
  acitNm?: string;
  crtmAcitAmt?: string;
};

// ------------------------------------------------------------------ 한 종목 조립

function toSnapshotItem(input: {
  item: KrxItem;
  stockCode: string;
  corpCode: string;
  price: PriceRow;
  summary: { row: SummaryRow; basis: StatementBasis };
  balance: BalanceRow[];
  previous: { row: SummaryRow; basis: StatementBasis } | null;
  accounts: ReturnType<typeof pickAccounts> | null;
  dartBasis: FinancialStatementBasis | null;
}): SnapshotItem {
  const { item, price, summary, balance, previous, accounts, dartBasis } = input;
  const s = summary.row;

  const marketCap = num(price.mrktTotAmt) ?? 0;
  const sales = num(s.enpSaleAmt) ?? 0;
  const ebit = num(s.enpBzopPft) ?? 0;
  const pretax = num(s.iclsPalClcAmt) ?? 0;
  const netIncome = num(s.enpCrtmNpf) ?? 0;
  const totalAssets = num(s.enpTastAmt) ?? 0;
  const totalLiabilities = num(s.enpTdbtAmt) ?? 0;
  const totalEquity = num(s.enpTcptAmt) ?? 0;

  const account = balanceAccounts(balance);
  const currentAssets = account("유동자산") ?? 0;
  const currentLiabilities = account("유동부채") ?? 0;
  const retainedEarnings = account("이익잉여금") ?? 0;

  const cash = accounts?.cash ?? 0;
  const ocf = accounts?.operatingCashFlow;
  const capex = accounts?.capex;
  const equityOfParent = accounts?.equityOfParent;

  const taxRate = effectiveTaxRate(pretax, netIncome);
  const ev = enterpriseValue(marketCap, totalLiabilities, cash);
  const fcf = ocf !== null && ocf !== undefined && capex !== null && capex !== undefined
    ? freeCashFlow(ocf, capex)
    : null;
  const eq = ocf !== null && ocf !== undefined ? earningsQuality(ocf, netIncome) : null;
  const du = dupont({ netIncome, sales, totalAssets, totalEquity });
  const perValue = per(marketCap, netIncome);

  const flags = anomalyFlags({
    effectiveTaxRate: taxRate,
    per: perValue,
    netIncome,
    previousNetIncome: previous ? num(previous.row.enpCrtmNpf) : null,
    earningsQuality: eq,
  });

  return {
    stockCode: input.stockCode,
    corpCode: input.corpCode,
    crno: item.crno ?? "",
    name: item.itmsNm ?? "",
    market: item.mrktCtg ?? "",
    marketCap,
    per: perValue,
    pbr: equityOfParent !== null && equityOfParent !== undefined
      ? pbr(marketCap, equityOfParent)
      : null,
    evToEbit: evToEbit(ev, ebit),
    roic: roic(ebit, taxRate ?? 0.22, investedCapital(totalAssets, currentLiabilities)),
    fcfYield: fcf !== null ? fcfYield(fcf, marketCap) : null,
    accrualRatio:
      ocf !== null && ocf !== undefined
        ? accrualRatio(netIncome, ocf, totalAssets)
        : null,
    earningsQuality: eq,
    ncavMultiple: ncavMultiple(currentAssets, totalLiabilities, marketCap),
    netMargin: du?.netMargin ?? null,
    assetTurnover: du?.assetTurnover ?? null,
    leverage: du?.leverage ?? null,
    effectiveTaxRate: taxRate,
    altmanZ: altmanZ({
      workingCapital: workingCapital(currentAssets, currentLiabilities),
      retainedEarnings,
      operatingIncome: ebit,
      marketCap,
      totalLiabilities,
      sales,
      totalAssets,
    }),
    percentile: null,
    rank: null,
    rankScore: null,
    flags,
    excludedReason: null,
    basis: { fsc: summary.basis, dart: dartBasis },
  };
}

/**
 * 지표가 모두 갖춰진 종목에만 백분위와 순위를 매긴다.
 *
 * 모집단은 규칙으로 걸러내기 전의 전 종목이다. 규칙은 이미 매겨진 값을 거를
 * 뿐이므로 규칙을 바꿔도 종목의 자리가 흔들리지 않는다.
 */
function assignPercentilesAndRanks(rows: SnapshotItem[]): void {
  const complete = rows.filter(
    (r) =>
      r.evToEbit !== null &&
      r.roic !== null &&
      r.fcfYield !== null &&
      r.altmanZ !== null &&
      r.per !== null &&
      r.pbr !== null,
  );

  const isComplete = new Set(complete);
  for (const r of rows) {
    if (isComplete.has(r)) continue;
    r.excludedReason =
      r.per === null || r.evToEbit === null
        ? "적자라 PER과 EV/EBIT이 정의되지 않음"
        : "지표를 계산할 원천 값이 모자람";
  }

  if (complete.length === 0) return;

  const ev = percentileRanks(complete.map((r) => r.evToEbit!));
  const rc = percentileRanks(complete.map((r) => r.roic!));
  const fy = percentileRanks(complete.map((r) => r.fcfYield!));
  const az = percentileRanks(complete.map((r) => r.altmanZ!));

  const ranked = combinedRank(
    complete.map((r) => ({
      id: r.stockCode,
      evToEbit: r.evToEbit!,
      roic: r.roic!,
    })),
  );

  complete.forEach((r, i) => {
    r.percentile = { evToEbit: ev[i], roic: rc[i], fcfYield: fy[i], altmanZ: az[i] };
    r.rank = ranked[i].rank;
    r.rankScore = ranked[i].rankScore;
  });
}

// ------------------------------------------------------------------------ 도구

function num(v: string | undefined): number | null {
  if (v === undefined) return null;
  const cleaned = v.replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function balanceAccounts(rows: BalanceRow[]) {
  const preferred = rows.filter((r) => r.fnclDcdNm?.includes("연결"));
  const source = preferred.length > 0 ? preferred : rows;
  const byName = new Map<string, number | null>();
  for (const r of source) {
    if (r.acitNm && !byName.has(r.acitNm)) byName.set(r.acitNm, num(r.crtmAcitAmt));
  }
  return (name: string) => byName.get(name) ?? null;
}

function groupBy<T>(rows: T[], key: (r: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    const list = m.get(k);
    if (list) list.push(r);
    else m.set(k, [r]);
  }
  return m;
}

/** 같은 키가 여러 기준일로 쌓인 목록에서 가장 늦은 한 건만 남긴다. */
function dedupeLatest<T extends { basDt?: string }>(
  rows: T[],
  key: (r: T) => string,
): T[] {
  const grouped = groupBy(rows, key);
  const out: T[] = [];
  for (const list of grouped.values()) {
    const latest = pickLatestByBasDt(list);
    if (latest) out.push(latest);
  }
  return out;
}

/** 오늘부터 거슬러 올라가며 데이터가 있는 가장 최근 기준일을 찾는다. */
async function findLatestBasDt(
  endpoint: string,
  key: string,
  maxDaysBack = 14,
): Promise<string> {
  const today = new Date();
  for (let back = 0; back <= maxDaysBack; back++) {
    const d = new Date(today);
    d.setDate(d.getDate() - back);
    const basDt = d.toISOString().slice(0, 10).replace(/-/g, "");
    const r = await fetchFsc(endpoint, { basDt, numOfRows: 1, pageNo: 1 }, key);
    if (r.ok && r.totalCount > 0) return basDt;
  }
  throw new Error(
    `최근 ${maxDaysBack}일 안에 데이터가 있는 기준일을 찾지 못했습니다: ${endpoint}`,
  );
}

async function fetchAllOrThrow<T>(
  label: string,
  endpoint: string,
  params: Record<string, string | number>,
  key: string,
  log?: Progress,
): Promise<T[]> {
  const r = await fetchFscAllPages<T>(endpoint, params, key, (page, got, total) => {
    log?.(`  ${label} p${page}: ${got}/${total}`);
  });
  if ("error" in r) throw new Error(`${label} 조회 실패: ${r.error}`);
  return r.items;
}

async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
  onProgress?: (done: number) => void,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  let done = 0;

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      for (;;) {
        const i = next++;
        if (i >= items.length) return;
        results[i] = await fn(items[i]);
        onProgress?.(++done);
      }
    }),
  );

  return results;
}
