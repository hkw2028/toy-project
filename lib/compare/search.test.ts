import { describe, expect, it } from "vitest";

import {
  parseSearchQuery,
  SEARCH_RESULT_LIMIT,
  toSearchResult,
  type KrxSearchItem,
} from "@/lib/compare/search";

describe("parseSearchQuery", () => {
  it("쿼리가 없으면 빈 문자열이다", () => {
    expect(parseSearchQuery({})).toBe("");
  });

  it("검색어 앞뒤 공백을 지운다", () => {
    expect(parseSearchQuery({ q: "  삼성전자  " })).toBe("삼성전자");
  });

  it("배열로 온 값은 첫 값을 쓴다", () => {
    expect(parseSearchQuery({ q: ["삼성", "SK"] })).toBe("삼성");
  });
});

describe("toSearchResult", () => {
  const item = (over: Partial<KrxSearchItem>): KrxSearchItem => ({
    crno: "0000000000000",
    corpNm: "종목(주)",
    itmsNm: "종목",
    mrktCtg: "KOSPI",
    ...over,
  });

  it("법인등록번호가 없는 결과는 제외한다", () => {
    const items = [item({ crno: "" }), item({ crno: "1" })];

    const r = toSearchResult(items, 2);

    expect(r.hits).toHaveLength(1);
  });

  it("상위 20건까지만 남긴다", () => {
    const items = Array.from({ length: 30 }, (_, i) => item({ crno: String(i) }));

    const r = toSearchResult(items, 30);

    expect(r.hits).toHaveLength(SEARCH_RESULT_LIMIT);
  });

  it("전체 건수가 표시 상한을 넘으면 더 있음을 알린다", () => {
    const items = Array.from({ length: 20 }, (_, i) => item({ crno: String(i) }));

    expect(toSearchResult(items, 25).hasMore).toBe(true);
    expect(toSearchResult(items, 20).hasMore).toBe(false);
  });

  it("같은 법인등록번호가 여러 날짜로 중복되면 하나만 남긴다", () => {
    const items = [
      item({ crno: "1", corpNm: "회사A" }),
      item({ crno: "1", corpNm: "회사A" }),
      item({ crno: "2", corpNm: "회사B" }),
    ];

    const r = toSearchResult(items, 3);

    expect(r.hits.map((h) => h.crno)).toEqual(["1", "2"]);
  });

  it("빈 목록이면 빈 결과를 준다", () => {
    expect(toSearchResult([], 0)).toEqual({ hits: [], hasMore: false });
  });

  it("법인명·종목명 검색이 같은 기업을 중복으로 맞혀 totalCount가 부풀어도, 고유 건수가 상한 이하면 더 있음을 알리지 않는다", () => {
    // 실측: "한화" 검색은 법인명·종목명 totalCount가 각각 15로 동일 기업
    // 15곳을 그대로 중복 매치한다. searchCompanies는 두 totalCount를 더해
    // 넘기므로(30) items(중복 포함 30건)는 원천 총합을 빠짐없이 담고 있다.
    const items = Array.from({ length: 15 }, (_, i) => item({ crno: String(i) }));
    const duplicated = [...items, ...items];

    const r = toSearchResult(duplicated, 30);

    expect(r.hits).toHaveLength(15);
    expect(r.hasMore).toBe(false);
  });
});
