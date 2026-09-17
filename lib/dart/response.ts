/**
 * OpenDART 응답 정규화.
 *
 * 이 API는 HTTP 상태가 아니라 본문의 `status` 코드로 결과를 알린다. 특히
 * `013`(조회된 데이터 없음)은 실패가 아니라 개별재무제표로 재시도하라는
 * 신호로 쓰이므로, 코드를 뭉개지 않고 그대로 보존한다.
 */

/**
 * 표본 30개 종목 전부에서 확인된 표준 계정 ID만 쓴다.
 *
 * 계정명은 회사마다 다르게 표기된다. 같은 차입금을 "차입금", "차입금및사채",
 * "단기차입금"으로 쓰기 때문에 이름으로 찾으면 종목마다 다른 값을 집게 된다.
 */
export const ACCOUNT = {
  cash: "ifrs-full_CashAndCashEquivalents",
  operatingCashFlow: "ifrs-full_CashFlowsFromUsedInOperatingActivities",
  capex:
    "ifrs-full_PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities",
  equityOfParent: "ifrs-full_EquityAttributableToOwnersOfParent",
  totalEquity: "ifrs-full_Equity",
  nonControllingInterests: "ifrs-full_NoncontrollingInterests",
} as const;

/** 계정이 속한 재무제표 구분. 재무상태표와 현금흐름표만 쓴다. */
const BALANCE_SHEET = "BS";
const CASH_FLOW = "CF";

export type DartAccountRow = {
  sj_div?: string;
  account_id?: string;
  account_nm?: string;
  thstrm_amount?: string;
};

export type DartParsed =
  | { ok: true; list: DartAccountRow[] }
  | { ok: false; code: string; reason: string };

export function parseDartResponse(raw: unknown): DartParsed {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, code: "UNKNOWN", reason: "응답이 객체가 아닙니다" };
  }

  const { status, message, list } = raw as {
    status?: string;
    message?: string;
    list?: DartAccountRow[];
  };

  if (status !== "000") {
    return {
      ok: false,
      code: status ?? "UNKNOWN",
      reason: message ?? "알 수 없는 오류",
    };
  }

  return { ok: true, list: list ?? [] };
}

export type PickedAccounts = {
  cash: number | null;
  operatingCashFlow: number | null;
  capex: number | null;
  equityOfParent: number | null;
};

/** 표준 계정 ID로 당기 금액을 꺼낸다. */
export function pickAccounts(list: DartAccountRow[]): PickedAccounts {
  // 자본변동표(SCE)는 같은 계정 ID를 기간별·구성요소별로 반복해서 쓰므로,
  // 재무상태표·현금흐름표 값과 섞이지 않도록 구간을 미리 나눈다.
  const bs = pickBySection(list, BALANCE_SHEET);
  const cf = pickBySection(list, CASH_FLOW);

  const cash = bs(ACCOUNT.cash);
  const operatingCashFlow = cf(ACCOUNT.operatingCashFlow);
  const capex = cf(ACCOUNT.capex);
  const equityOfParent = deriveEquityOfParent(bs);

  return { cash, operatingCashFlow, capex, equityOfParent };
}

/**
 * 지배기업 소유주지분을 구한다.
 *
 * 직접 태그가 있으면 그 값을 쓴다. 없으면 자본총계에서 비지배지분을 뺀
 * 값으로 유도한다. 개별재무제표는 지배주주·비지배주주 구분 자체가 없어
 * 이 태그를 아예 쓰지 않으므로, 자본총계를 그대로 지배주주지분으로 본다.
 */
function deriveEquityOfParent(
  bs: (id: string) => number | null,
): number | null {
  const direct = bs(ACCOUNT.equityOfParent);
  if (direct !== null) return direct;

  const totalEquity = bs(ACCOUNT.totalEquity);
  if (totalEquity === null) return null;

  const nci = bs(ACCOUNT.nonControllingInterests) ?? 0;
  return totalEquity - nci;
}

/** 주어진 재무제표 구분(BS/CF)에서만 계정 ID로 값을 찾는 조회 함수를 만든다. */
function pickBySection(
  list: DartAccountRow[],
  section: string,
): (id: string) => number | null {
  const byId = new Map<string, string>();
  for (const row of list) {
    if (row.sj_div === section && row.account_id && !byId.has(row.account_id)) {
      byId.set(row.account_id, row.thstrm_amount ?? "");
    }
  }
  return (id: string) => toAmount(byId.get(id));
}

/** `"1,723,750,652,721"` 같은 표기를 숫자로 바꾼다. */
function toAmount(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const cleaned = raw.replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
