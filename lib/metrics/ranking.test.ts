import { describe, expect, it } from "vitest";

import { combinedRank, percentileRanks } from "@/lib/metrics/ranking";

describe("percentileRanks", () => {
  it("가장 작은 값이 0, 가장 큰 값이 100이 되도록 오름차순으로 매긴다", () => {
    expect(percentileRanks([10, 20, 30, 40, 50])).toEqual([0, 25, 50, 75, 100]);
  });

  it("입력 순서와 무관하게 값에 따라 매긴다", () => {
    expect(percentileRanks([50, 10, 30])).toEqual([100, 0, 50]);
  });

  it("동점은 같은 백분위를 받는다", () => {
    const [a, b, c, d] = percentileRanks([10, 20, 20, 30]);
    expect(a).toBe(0);
    expect(b).toBeCloseTo(100 / 3, 10);
    expect(c).toBeCloseTo(100 / 3, 10);
    expect(d).toBe(100);
  });

  it("값이 하나뿐이면 0을 준다", () => {
    expect(percentileRanks([42])).toEqual([0]);
  });

  it("빈 배열이면 빈 배열을 준다", () => {
    expect(percentileRanks([])).toEqual([]);
  });
});

describe("combinedRank", () => {
  // 마법공식: EV/EBIT이 쌀수록, ROIC이 높을수록 좋은 순위를 받는다.
  //
  // EV/EBIT 오름차순: C(1) D(2) A(3) B(4)
  // ROIC 내림차순:   B(1) D(2) A(3) C(4)
  // 합산:            D=4, C=5, B=5, A=6
  const 종목 = [
    { id: "A", evToEbit: 5, roic: 0.3 },
    { id: "B", evToEbit: 8, roic: 0.4 },
    { id: "C", evToEbit: 3, roic: 0.1 },
    { id: "D", evToEbit: 4, roic: 0.35 },
  ];

  it("EV/EBIT 오름차순 순위와 ROIC 내림차순 순위를 더한다", () => {
    const 점수 = Object.fromEntries(
      combinedRank(종목).map((x) => [x.id, x.rankScore]),
    );
    expect(점수).toEqual({ A: 6, B: 5, C: 5, D: 4 });
  });

  it("합산 점수가 낮은 순으로 최종 순위를 매기고 1부터 시작한다", () => {
    const 순위 = Object.fromEntries(
      combinedRank(종목).map((x) => [x.id, x.rank]),
    );
    // 동점은 같은 순위를 받고, 다음 순위는 그만큼 건너뛴다.
    expect(순위).toEqual({ D: 1, B: 2, C: 2, A: 4 });
  });

  it("빈 입력이면 빈 결과를 준다", () => {
    expect(combinedRank([])).toEqual([]);
  });
});
