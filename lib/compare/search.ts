import {
  FSC_ENDPOINT,
  fetchFsc,
  findLatestBasDt,
} from "@/lib/fsc/client";
import type { RawSearchParams } from "@/lib/compare/basket";

/** 검색 결과는 이 개수까지만 보여준다. 넘치면 더 좁혀 검색하라고 안내한다. */
export const SEARCH_RESULT_LIMIT = 20;

export type KrxSearchItem = {
  crno?: string;
  corpNm?: string;
  itmsNm?: string;
  mrktCtg?: string;
};

export type CompanyHit = {
  crno: string;
  corpNm: string;
  itmsNm: string;
  market: string;
};

export type SearchResult = { hits: CompanyHit[]; hasMore: boolean };

/** URL 쿼리에서 검색어를 읽는다. */
export function parseSearchQuery(searchParams: RawSearchParams): string {
  const raw = searchParams.q;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? "").trim();
}

/**
 * KRX 검색 응답을 화면에 보여줄 결과로 정리한다.
 *
 * 법인등록번호가 없는 항목(데이터 품질 이상)은 뺀다. 같은 법인이 여러
 * 기준일로, 또는 법인명·종목명 두 검색 모두에 걸려 중복으로 올 수 있어
 * 법인등록번호로 중복을 제거한 뒤 상한만큼 자른다.
 *
 * `totalCount`는 원천이 돌려준 매치 총합(법인명 검색과 종목명 검색의 합)이라
 * 같은 기업이 양쪽에 다 걸리면 실제 고유 건수보다 크게 잡힌다. `items`가
 * 그 총합을 빠짐없이 담고 있으면(잘리지 않았으면) 중복 제거 후 센 고유
 * 건수로 정확히 판단하고, 원천이 다 주지 않아 `items`가 모자라면(더 받아올
 * 여지가 있으면) 안전하게 더 있다고 본다.
 */
export function toSearchResult(
  items: KrxSearchItem[],
  totalCount: number,
): SearchResult {
  const seen = new Set<string>();
  const hits: CompanyHit[] = [];
  let uniqueCount = 0;

  for (const item of items) {
    const crno = item.crno?.trim();
    if (!crno || seen.has(crno)) continue;
    seen.add(crno);
    uniqueCount++;
    if (hits.length < SEARCH_RESULT_LIMIT) {
      hits.push({
        crno,
        corpNm: item.corpNm ?? "",
        itmsNm: item.itmsNm ?? "",
        market: item.mrktCtg ?? "",
      });
    }
  }

  const truncated = items.length < totalCount;
  return { hits, hasMore: truncated || uniqueCount > SEARCH_RESULT_LIMIT };
}

/**
 * 법인명·종목명 부분일치로 국내 상장 기업을 찾는다.
 *
 * `likeCorpNm`(법인명)과 `likeItmsNm`(종목명)은 활용신청서 명세에 없지만
 * 실제로 부분일치를 지원한다(spec.md의 남은 위험 참고). 법인명과 종목명이
 * 크게 다른 회사가 있어서("SK하이닉스"는 종목명일 뿐 법인명은
 * "에스케이하이닉스(주)") 두 파라미터를 함께 넣으면 AND로 묶여 검색이
 * 안 된다(실측 확인). 그래서 두 번 따로 조회해 합친다.
 */
export async function searchCompanies(
  query: string,
  key: string,
): Promise<SearchResult | { error: string }> {
  const basDt = await findLatestBasDt(FSC_ENDPOINT.listedItems, key);
  // hasMore 판단은 totalCount로 이미 정확하다. 넉넉히 더 받는 건 중복
  // 제거로 상한에 못 미치는 경우를 대비한 여유일 뿐이라 크게 잡지 않는다.
  const fetchSize = SEARCH_RESULT_LIMIT + 5;

  const [byCorpNm, byItmsNm] = await Promise.all([
    fetchFsc<KrxSearchItem>(
      FSC_ENDPOINT.listedItems,
      { basDt, likeCorpNm: query, numOfRows: fetchSize, pageNo: 1 },
      key,
    ),
    fetchFsc<KrxSearchItem>(
      FSC_ENDPOINT.listedItems,
      { basDt, likeItmsNm: query, numOfRows: fetchSize, pageNo: 1 },
      key,
    ),
  ]);

  if (!byCorpNm.ok) return { error: `[${byCorpNm.code}] ${byCorpNm.reason}` };
  if (!byItmsNm.ok) return { error: `[${byItmsNm.code}] ${byItmsNm.reason}` };

  return toSearchResult(
    [...byCorpNm.items, ...byItmsNm.items],
    byCorpNm.totalCount + byItmsNm.totalCount,
  );
}
