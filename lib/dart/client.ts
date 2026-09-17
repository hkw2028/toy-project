import { unzipSync, strFromU8 } from "fflate";

import { parseDartResponse, type DartParsed } from "@/lib/dart/response";

const BASE = "https://opendart.fss.or.kr/api";

export class DartKeyMissingError extends Error {
  constructor() {
    super(
      "OpenDART 인증키가 없습니다. .env.local에 OPENDART_API_KEY를 넣어주세요.",
    );
    this.name = "DartKeyMissingError";
  }
}

export function readDartKey(env: NodeJS.ProcessEnv = process.env): string {
  const key = env.OPENDART_API_KEY?.trim();
  if (!key) throw new DartKeyMissingError();
  return key;
}

/** 사업보고서. 분기·반기가 아닌 연간 확정 수치를 쓴다. */
export const ANNUAL_REPORT_CODE = "11011";

export type FinancialStatementBasis = "CFS" | "OFS";

/**
 * 요청 간 최소 간격.
 *
 * 문서에 적힌 한도는 일 20,000건뿐이지만, 종목 단위 조회를 간격 없이 몰아치면
 * 일일 한도에 한참 못 미치는 상태에서도 서버가 연결을 끊고 그 차단이 20분
 * 넘게 이어진다. 차단 상태에서는 남은 종목을 아무리 두드려도 얻을 수 없으므로
 * 처음부터 속도를 낮춰 보내는 편이 전체적으로 빠르다.
 */
const MIN_INTERVAL_MS = 150;

/** 연결이 끊겼을 때 다시 시도하는 횟수. */
const MAX_ATTEMPTS = 3;

let nextSlotAt = 0;

async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, nextSlotAt - now);
  nextSlotAt = Math.max(now, nextSlotAt) + MIN_INTERVAL_MS;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

/** 요청이 거부되어 더 보내봐야 소용없는 상태. */
export class DartBlockedError extends Error {
  constructor(reason: string) {
    super(
      `OpenDART가 요청을 거부하고 있습니다(${reason}). ` +
        "짧은 시간에 너무 많이 호출하면 IP 단위로 차단되며 한동안 풀리지 않습니다. " +
        "시간을 두고 다시 시도해 주세요.",
    );
    this.name = "DartBlockedError";
  }
}

export async function fetchStatements(
  corpCode: string,
  bizYear: number,
  basis: FinancialStatementBasis,
  key: string,
): Promise<DartParsed> {
  const url =
    `${BASE}/fnlttSinglAcntAll.json?crtfc_key=${encodeURIComponent(key)}` +
    `&corp_code=${corpCode}&bsns_year=${bizYear}` +
    `&reprt_code=${ANNUAL_REPORT_CODE}&fs_div=${basis}`;

  let lastReason = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await throttle();
    try {
      const res = await fetch(url);
      return parseDartResponse(await res.json());
    } catch (e) {
      lastReason = e instanceof Error ? e.message : String(e);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
      }
    }
  }

  return { ok: false, code: "NETWORK", reason: lastReason };
}

export type CorpCodeEntry = {
  corpCode: string;
  corpName: string;
  stockCode: string;
};

/**
 * 종목코드와 고유번호의 대응표.
 *
 * OpenDART에는 법인등록번호가 없어 종목코드가 금융위 데이터와의 유일한
 * 연결 고리다. 이 목록은 ZIP 안의 XML 한 건으로 온다.
 */
export async function fetchListedCorpCodes(
  key: string,
): Promise<{ entries: CorpCodeEntry[] } | { error: string }> {
  let xml: string;
  try {
    const res = await fetch(
      `${BASE}/corpCode.xml?crtfc_key=${encodeURIComponent(key)}`,
    );
    const buf = new Uint8Array(await res.arrayBuffer());

    // 인증 실패는 ZIP이 아니라 XML 오류 본문으로 온다.
    if (!(buf[0] === 0x50 && buf[1] === 0x4b)) {
      const text = strFromU8(buf);
      const status = /<status>(\d+)<\/status>/.exec(text)?.[1] ?? "UNKNOWN";
      const message = /<message>(.*?)<\/message>/.exec(text)?.[1] ?? text.slice(0, 120);
      return { error: `[${status}] ${message}` };
    }

    const files = unzipSync(buf);
    const entry = Object.values(files)[0];
    if (!entry) return { error: "고유번호 파일이 비어 있습니다" };
    xml = strFromU8(entry);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }

  return { entries: parseCorpCodeXml(xml) };
}

/** 상장 종목만 남긴다. 종목코드가 빈 항목은 비상장이다. */
function parseCorpCodeXml(xml: string): CorpCodeEntry[] {
  const entries: CorpCodeEntry[] = [];
  const field = (block: string, tag: string) =>
    new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(block)?.[1]?.trim() ?? "";

  for (const m of xml.matchAll(/<list>([\s\S]*?)<\/list>/g)) {
    const block = m[1];
    const stockCode = field(block, "stock_code");
    if (!stockCode) continue;
    entries.push({
      corpCode: field(block, "corp_code"),
      corpName: field(block, "corp_name"),
      stockCode,
    });
  }

  return entries;
}
