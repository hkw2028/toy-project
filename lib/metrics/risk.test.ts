import { describe, expect, it } from "vitest";

import { altmanZ, workingCapital } from "@/lib/metrics/risk";

// 롯데쇼핑(023530) 2025 사업연도 실제 원천값.
const 롯데쇼핑 = {
  매출액: 13_738_354_725_833,
  영업이익: 547_037_221_095,
  자산총계: 37_910_298_847_681,
  부채총계: 21_044_102_609_491,
  유동자산: 5_195_038_635_804,
  유동부채: 9_989_934_467_307,
  이익잉여금: 7_440_521_126_282,
  시가총액: 2_050_934_737_500,
};

describe("workingCapital", () => {
  it("유동자산에서 유동부채를 뺀다", () => {
    expect(workingCapital(롯데쇼핑.유동자산, 롯데쇼핑.유동부채)).toBe(
      -4_794_895_831_503,
    );
  });
});

describe("altmanZ", () => {
  it("다섯 항목의 가중합으로 구한다", () => {
    expect(
      altmanZ({
        workingCapital: -4_794_895_831_503,
        retainedEarnings: 롯데쇼핑.이익잉여금,
        operatingIncome: 롯데쇼핑.영업이익,
        marketCap: 롯데쇼핑.시가총액,
        totalLiabilities: 롯데쇼핑.부채총계,
        sales: 롯데쇼핑.매출액,
        totalAssets: 롯데쇼핑.자산총계,
      }),
    ).toBeCloseTo(0.591482, 5);
  });

  it("자산총계가 0 이하면 정의되지 않는다", () => {
    expect(
      altmanZ({
        workingCapital: 10,
        retainedEarnings: 10,
        operatingIncome: 10,
        marketCap: 10,
        totalLiabilities: 10,
        sales: 10,
        totalAssets: 0,
      }),
    ).toBeNull();
  });

  it("부채총계가 0 이하면 정의되지 않는다", () => {
    expect(
      altmanZ({
        workingCapital: 10,
        retainedEarnings: 10,
        operatingIncome: 10,
        marketCap: 10,
        totalLiabilities: 0,
        sales: 10,
        totalAssets: 100,
      }),
    ).toBeNull();
  });
});
