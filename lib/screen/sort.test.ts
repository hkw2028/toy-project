import { describe, expect, it } from "vitest";

import type { RankedItem } from "@/lib/screen/rules";
import {
  DEFAULT_SORT,
  parseSort,
  sortHref,
  sortItems,
} from "@/lib/screen/sort";

const item = (over: Partial<RankedItem>): RankedItem =>
  ({
    stockCode: "000000",
    corpCode: "",
    crno: "",
    name: "종목",
    market: "KOSPI",
    marketCap: 1000,
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
  }) as RankedItem;

describe("parseSort", () => {
  it("쿼리가 없으면 시가총액 내림차순을 기본으로 쓴다", () => {
    expect(parseSort({})).toEqual({ key: "marketCap", direction: "desc" });
    expect(DEFAULT_SORT).toEqual({ key: "marketCap", direction: "desc" });
  });

  it("쿼리로 지정한 열과 방향을 쓴다", () => {
    expect(parseSort({ sort: "per", dir: "asc" })).toEqual({
      key: "per",
      direction: "asc",
    });
  });

  it("모르는 열 이름이면 기본값으로 되돌린다", () => {
    expect(parseSort({ sort: "없는열", dir: "asc" })).toEqual(DEFAULT_SORT);
  });

  it("모르는 방향이면 그 열의 첫 클릭 방향을 쓴다", () => {
    // 숫자 열은 큰 값이 먼저 보이는 편이 쓸모 있다.
    expect(parseSort({ sort: "roic", dir: "위로" })).toEqual({
      key: "roic",
      direction: "desc",
    });
    // 이름은 가나다순이 자연스럽다.
    expect(parseSort({ sort: "name", dir: "위로" })).toEqual({
      key: "name",
      direction: "asc",
    });
  });

  it("배열로 온 값은 첫 값을 쓴다", () => {
    expect(parseSort({ sort: ["pbr", "per"], dir: ["asc"] })).toEqual({
      key: "pbr",
      direction: "asc",
    });
  });
});

describe("sortItems", () => {
  it("숫자 열을 오름차순으로 정렬한다", () => {
    const items = [
      item({ stockCode: "B", marketCap: 200 }),
      item({ stockCode: "A", marketCap: 100 }),
      item({ stockCode: "C", marketCap: 300 }),
    ];

    const sorted = sortItems(items, { key: "marketCap", direction: "asc" });

    expect(sorted.map((x) => x.stockCode)).toEqual(["A", "B", "C"]);
  });

  it("숫자 열을 내림차순으로 정렬한다", () => {
    const items = [
      item({ stockCode: "B", marketCap: 200 }),
      item({ stockCode: "A", marketCap: 100 }),
      item({ stockCode: "C", marketCap: 300 }),
    ];

    const sorted = sortItems(items, { key: "marketCap", direction: "desc" });

    expect(sorted.map((x) => x.stockCode)).toEqual(["C", "B", "A"]);
  });

  it("종목명은 가나다순으로 정렬한다", () => {
    const items = [
      item({ stockCode: "1", name: "하나머티리얼즈" }),
      item({ stockCode: "2", name: "가온칩스" }),
      item({ stockCode: "3", name: "나이스정보통신" }),
    ];

    const sorted = sortItems(items, { key: "name", direction: "asc" });

    expect(sorted.map((x) => x.name)).toEqual([
      "가온칩스",
      "나이스정보통신",
      "하나머티리얼즈",
    ]);
  });

  it("Altman Z는 원값이 아니라 백분위로 정렬한다", () => {
    const items = [
      item({
        stockCode: "A",
        altmanZ: 99,
        percentile: { evToEbit: 0, roic: 0, fcfYield: 0, altmanZ: 10 },
      }),
      item({
        stockCode: "B",
        altmanZ: 1,
        percentile: { evToEbit: 0, roic: 0, fcfYield: 0, altmanZ: 90 },
      }),
    ];

    const sorted = sortItems(items, { key: "altmanZ", direction: "desc" });

    expect(sorted.map((x) => x.stockCode)).toEqual(["B", "A"]);
  });

  it("값이 같으면 순위가 앞선 종목을 먼저 둔다", () => {
    const items = [
      item({ stockCode: "늦은순위", marketCap: 100, rank: 9 }),
      item({ stockCode: "이른순위", marketCap: 100, rank: 2 }),
    ];

    const sorted = sortItems(items, { key: "marketCap", direction: "desc" });

    expect(sorted.map((x) => x.stockCode)).toEqual(["이른순위", "늦은순위"]);
  });

  it("원본 배열을 바꾸지 않는다", () => {
    const items = [
      item({ stockCode: "B", marketCap: 200 }),
      item({ stockCode: "A", marketCap: 100 }),
    ];

    sortItems(items, { key: "marketCap", direction: "asc" });

    expect(items.map((x) => x.stockCode)).toEqual(["B", "A"]);
  });
});

describe("sortHref", () => {
  it("규칙 쿼리를 그대로 두고 정렬 값만 바꾼다", () => {
    const href = sortHref({ evebit: "30", n: "50" }, "per");
    const q = new URLSearchParams(href.replace(/^\?/, ""));

    expect(q.get("evebit")).toBe("30");
    expect(q.get("n")).toBe("50");
    expect(q.get("sort")).toBe("per");
  });

  it("지금 정렬 중인 열을 다시 누르면 방향이 뒤집힌다", () => {
    const href = sortHref({ sort: "per", dir: "asc" }, "per");

    expect(new URLSearchParams(href.replace(/^\?/, "")).get("dir")).toBe("desc");
  });

  it("다른 열을 누르면 그 열의 첫 클릭 방향으로 간다", () => {
    const 숫자열 = sortHref({ sort: "per", dir: "asc" }, "roic");
    const 이름열 = sortHref({ sort: "per", dir: "asc" }, "name");

    expect(new URLSearchParams(숫자열.replace(/^\?/, "")).get("dir")).toBe(
      "desc",
    );
    expect(new URLSearchParams(이름열.replace(/^\?/, "")).get("dir")).toBe(
      "asc",
    );
  });

  it("쿼리가 비어 있어도 기본 정렬을 기준으로 토글한다", () => {
    // 기본이 시가총액 내림차순이므로 시가총액을 누르면 오름차순이 된다.
    const href = sortHref({}, "marketCap");

    expect(new URLSearchParams(href.replace(/^\?/, "")).get("dir")).toBe("asc");
  });
});
