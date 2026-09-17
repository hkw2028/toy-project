import { describe, expect, it } from "vitest";

import {
  applyRules,
  capResults,
  parseRules,
  summarizeExclusions,
} from "@/lib/screen/rules";
import type { SnapshotItem } from "@/lib/universe/build";

describe("parseRules", () => {
  it("쿼리가 비어 있으면 기본값을 쓴다", () => {
    expect(parseRules({})).toEqual({
      evEbitMaxPercentile: 50,
      roicMinPercentile: 50,
      fcfYieldMinPercentile: 50,
      altmanZMinPercentile: 30,
      resultCount: 20,
    });
  });

  it("쿼리 값을 그대로 반영한다", () => {
    expect(
      parseRules({ evebit: "70", roic: "40", fcf: "10", z: "0", n: "50" }),
    ).toEqual({
      evEbitMaxPercentile: 70,
      roicMinPercentile: 40,
      fcfYieldMinPercentile: 10,
      altmanZMinPercentile: 0,
      resultCount: 50,
    });
  });

  it("백분위는 0~100 범위로 자른다", () => {
    expect(parseRules({ evebit: "150", roic: "-10" })).toMatchObject({
      evEbitMaxPercentile: 100,
      roicMinPercentile: 0,
    });
  });

  it("결과 개수는 1~200 범위로 자르고 정수로 내림한다", () => {
    expect(parseRules({ n: "0" }).resultCount).toBe(1);
    expect(parseRules({ n: "500" }).resultCount).toBe(200);
    expect(parseRules({ n: "12.9" }).resultCount).toBe(12);
  });

  it("숫자로 읽을 수 없는 값은 기본값으로 되돌린다", () => {
    expect(parseRules({ evebit: "abc" }).evEbitMaxPercentile).toBe(50);
  });

  it("배열로 온 값(같은 키 중복)은 첫 값을 쓴다", () => {
    expect(parseRules({ evebit: ["70", "10"] }).evEbitMaxPercentile).toBe(70);
  });
});

describe("applyRules", () => {
  const item = (over: Partial<SnapshotItem>): SnapshotItem =>
    ({
      stockCode: "000000",
      corpCode: "",
      crno: "",
      name: "종목",
      market: "KOSPI",
      marketCap: 0,
      per: 10,
      pbr: 1,
      evToEbit: 5,
      roic: 0.1,
      fcfYield: 0.1,
      accrualRatio: 0,
      earningsQuality: 1,
      ncavMultiple: 0,
      netMargin: 0.1,
      assetTurnover: 0.5,
      leverage: 1.5,
      effectiveTaxRate: 0.2,
      altmanZ: 2,
      percentile: { evToEbit: 50, roic: 50, fcfYield: 50, altmanZ: 50 },
      rank: 1,
      rankScore: 2,
      flags: [],
      excludedReason: null,
      basis: { fsc: "consolidated", dart: "CFS" },
      ...over,
    }) as SnapshotItem;

  const rules = {
    evEbitMaxPercentile: 50,
    roicMinPercentile: 50,
    fcfYieldMinPercentile: 50,
    altmanZMinPercentile: 50,
    resultCount: 20,
  };

  it("네 백분위 조건을 모두 만족하는 종목만 남긴다", () => {
    const 통과 = item({ stockCode: "A" });
    const ev탈락 = item({
      stockCode: "B",
      percentile: { evToEbit: 51, roic: 50, fcfYield: 50, altmanZ: 50 },
    });
    const roic탈락 = item({
      stockCode: "C",
      percentile: { evToEbit: 50, roic: 49, fcfYield: 50, altmanZ: 50 },
    });

    const r = applyRules([통과, ev탈락, roic탈락], rules);

    expect(r.matched.map((x) => x.stockCode)).toEqual(["A"]);
  });

  it("모집단은 지표가 계산된(percentile 있는) 종목 수다", () => {
    const 완성 = item({ stockCode: "A" });
    const 미완성 = item({ stockCode: "B", percentile: null, excludedReason: "적자" });

    const r = applyRules([완성, 미완성], rules);

    expect(r.population).toBe(1);
  });

  it("결과 개수는 자르지 않는다 — 정렬·자르기는 상위 조합 계층의 몫이다", () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      item({ stockCode: String(i), rank: i + 1 }),
    );

    const r = applyRules(items, { ...rules, resultCount: 2 });

    expect(r.matched).toHaveLength(5);
    expect(r.population).toBe(5);
  });

  it("빈 입력이면 일치 목록과 모집단 모두 0이다", () => {
    const r = applyRules([], rules);

    expect(r).toEqual({ population: 0, matched: [] });
  });
});

describe("capResults", () => {
  it("정해진 개수만큼만 남긴다", () => {
    expect(capResults([1, 2, 3, 4, 5], 2)).toEqual([1, 2]);
  });

  it("개수가 전체보다 크면 있는 만큼만 준다", () => {
    expect(capResults([1, 2], 10)).toEqual([1, 2]);
  });

  it("원본 배열을 바꾸지 않는다", () => {
    const items = [1, 2, 3];
    capResults(items, 1);
    expect(items).toEqual([1, 2, 3]);
  });
});

describe("summarizeExclusions", () => {
  const item = (over: Partial<SnapshotItem>): SnapshotItem =>
    ({
      stockCode: "0",
      corpCode: "",
      crno: "",
      name: "",
      market: "",
      marketCap: 0,
      per: null,
      pbr: null,
      evToEbit: null,
      roic: null,
      fcfYield: null,
      accrualRatio: null,
      earningsQuality: null,
      ncavMultiple: null,
      netMargin: null,
      assetTurnover: null,
      leverage: null,
      effectiveTaxRate: null,
      altmanZ: null,
      percentile: null,
      rank: null,
      rankScore: null,
      flags: [],
      excludedReason: null,
      basis: { fsc: null, dart: null },
      ...over,
    }) as SnapshotItem;

  it("제외 사유별 건수를 센다", () => {
    const items = [
      item({ excludedReason: "적자라 PER과 EV/EBIT이 정의되지 않음" }),
      item({ excludedReason: "적자라 PER과 EV/EBIT이 정의되지 않음" }),
      item({ excludedReason: "지표를 계산할 원천 값이 모자람" }),
      item({ excludedReason: null, percentile: { evToEbit: 1, roic: 1, fcfYield: 1, altmanZ: 1 } }),
    ];

    expect(summarizeExclusions(items)).toEqual({
      "적자라 PER과 EV/EBIT이 정의되지 않음": 2,
      "지표를 계산할 원천 값이 모자람": 1,
    });
  });

  it("제외된 종목이 없으면 빈 객체를 준다", () => {
    expect(summarizeExclusions([item({ excludedReason: null })])).toEqual({});
  });
});
