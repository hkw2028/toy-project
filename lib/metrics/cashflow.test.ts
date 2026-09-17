import { describe, expect, it } from "vitest";

import {
  accrualRatio,
  earningsQuality,
  freeCashFlow,
  fcfYield,
} from "@/lib/metrics/cashflow";

// 롯데쇼핑(023530) 2025 사업연도 실제 원천값.
const 롯데쇼핑 = {
  시가총액: 2_050_934_737_500,
  당기순이익: 73_555_557_525,
  자산총계: 37_910_298_847_681,
  영업활동현금흐름: 1_723_750_652_721,
  유형자산취득: 651_764_091_594,
};

describe("freeCashFlow", () => {
  it("영업활동현금흐름에서 유형자산 취득액을 뺀다", () => {
    expect(
      freeCashFlow(롯데쇼핑.영업활동현금흐름, 롯데쇼핑.유형자산취득),
    ).toBe(1_071_986_561_127);
  });
});

describe("fcfYield", () => {
  it("잉여현금흐름을 시가총액으로 나눈다", () => {
    expect(fcfYield(1_071_986_561_127, 롯데쇼핑.시가총액)).toBeCloseTo(
      0.522682,
      5,
    );
  });

  it("잉여현금흐름이 음수여도 값을 낸다", () => {
    expect(fcfYield(-500, 1000)).toBeCloseTo(-0.5, 10);
  });

  it("시가총액이 0 이하면 정의되지 않는다", () => {
    expect(fcfYield(100, 0)).toBeNull();
  });
});

describe("accrualRatio", () => {
  it("당기순이익에서 영업활동현금흐름을 뺀 값을 자산총계로 나눈다", () => {
    expect(
      accrualRatio(
        롯데쇼핑.당기순이익,
        롯데쇼핑.영업활동현금흐름,
        롯데쇼핑.자산총계,
      ),
    ).toBeCloseTo(-0.043529, 6);
  });

  it("이익이 현금흐름을 앞서면 양수가 된다", () => {
    expect(accrualRatio(200, 100, 1000)).toBeCloseTo(0.1, 10);
  });

  it("자산총계가 0 이하면 정의되지 않는다", () => {
    expect(accrualRatio(100, 50, 0)).toBeNull();
  });
});

describe("earningsQuality", () => {
  it("영업활동현금흐름을 당기순이익으로 나눈다", () => {
    expect(
      earningsQuality(롯데쇼핑.영업활동현금흐름, 롯데쇼핑.당기순이익),
    ).toBeCloseTo(23.434676, 5);
  });

  it("당기순이익이 0 이하면 정의되지 않는다", () => {
    expect(earningsQuality(100, 0)).toBeNull();
    expect(earningsQuality(100, -50)).toBeNull();
  });
});
