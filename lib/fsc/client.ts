import { parseFscResponse, type FscParsed } from "@/lib/fsc/response";

/**
 * 금융위원회 오픈API 호출.
 *
 * 같은 기관 API인데도 베이스 URL이 두 갈래다. 기업재무정보와 기업기본정보는
 * `/service/` 구간이 있고 http로, 주식시세정보와 KRX상장종목정보는 그 구간이
 * 없고 https에 `_V2` 접미사가 붙는다. 이 차이를 여기서만 다룬다.
 */
const FINANCE_BASE = "http://apis.data.go.kr/1160100/service";
const MARKET_BASE = "https://apis.data.go.kr/1160100";

export const FSC_ENDPOINT = {
  summaryFinancials: `${FINANCE_BASE}/GetFinaStatInfoService_V2/getSummFinaStat_V2`,
  balanceSheet: `${FINANCE_BASE}/GetFinaStatInfoService_V2/getBs_V2`,
  stockPrice: `${MARKET_BASE}/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2`,
  listedItems: `${MARKET_BASE}/GetKrxListedInfoService_V2/getItemInfo_V2`,
} as const;

export class FscKeyMissingError extends Error {
  constructor() {
    super(
      "공공데이터포털 인증키가 없습니다. .env.local에 DATA_GO_KR_SERVICE_KEY를 넣어주세요.",
    );
    this.name = "FscKeyMissingError";
  }
}

export function readFscKey(env: NodeJS.ProcessEnv = process.env): string {
  const key = env.DATA_GO_KR_SERVICE_KEY?.trim();
  if (!key) throw new FscKeyMissingError();
  return key;
}

/** 인코딩된 키(`%2B` 등 포함)는 그대로, 디코딩된 키는 인코딩해서 보낸다. */
function encodeKey(key: string): string {
  return key.includes("%") ? key : encodeURIComponent(key);
}

export async function fetchFsc<T>(
  endpoint: string,
  params: Record<string, string | number>,
  key: string,
): Promise<FscParsed<T>> {
  const query = Object.entries({ ...params, resultType: "json" })
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  const url = `${endpoint}?${query}&serviceKey=${encodeKey(key)}`;

  let raw: unknown;
  try {
    const res = await fetch(url);
    const text = await res.text();
    raw = text.trimStart().startsWith("{") ? JSON.parse(text) : text;
  } catch (e) {
    return {
      ok: false,
      code: "NETWORK",
      reason: e instanceof Error ? e.message : String(e),
    };
  }

  return parseFscResponse<T>(raw);
}

/**
 * 10,000건 단위로 나뉘는 목록을 끝까지 받는다.
 *
 * 원천이 한 번에 최대 10,000건까지만 돌려주므로 전체 건수를 보고 이어 받는다.
 */
export async function fetchFscAllPages<T>(
  endpoint: string,
  params: Record<string, string | number>,
  key: string,
  onPage?: (page: number, received: number, total: number) => void,
): Promise<{ items: T[] } | { error: string }> {
  const PAGE_SIZE = 10_000;
  const items: T[] = [];

  for (let page = 1; ; page++) {
    const r = await fetchFsc<T>(
      endpoint,
      { ...params, numOfRows: PAGE_SIZE, pageNo: page },
      key,
    );
    if (!r.ok) return { error: `[${r.code}] ${r.reason}` };

    items.push(...r.items);
    onPage?.(page, items.length, r.totalCount);

    if (items.length >= r.totalCount || r.items.length === 0) break;
  }

  return { items };
}
