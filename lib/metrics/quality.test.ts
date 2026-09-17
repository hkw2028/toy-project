import { describe, expect, it } from "vitest";

import {
  dupont,
  effectiveTaxRate,
  investedCapital,
  roic,
} from "@/lib/metrics/quality";

// 롯데쇼핑(023530) 2025 사업연도 실제 원천값.
const 롯데쇼핑 = {
  매출액: 13_738_354_725_833,
  영업이익: 547_037_221_095,
  당기순이익: 73_555_557_525,
  세전이익: 83_446_963_642,
  자산총계: 37_910_298_847_681,
  유동부채: 9_989_934_467_307,
  자본총계: 16_866_196_238_190,
};

describe("effectiveTaxRate", () => {
  it("세전이익에서 당기순이익을 뺀 값을 세전이익으로 나눈다", () => {
    expect(
      effectiveTaxRate(롯데쇼핑.세전이익, 롯데쇼핑.당기순이익),
    ).toBeCloseTo(0.118535, 5);
  });

  it("세전이익이 0 이하면 정의되지 않는다", () => {
    expect(effectiveTaxRate(0, 100)).toBeNull();
    expect(effectiveTaxRate(-100, 50)).toBeNull();
  });
});

describe("investedCapital", () => {
  it("총자산에서 유동부채를 뺀 값으로 근사한다", () => {
    expect(investedCapital(롯데쇼핑.자산총계, 롯데쇼핑.유동부채)).toBe(
      27_920_364_380_374,
    );
  });
});

describe("roic", () => {
  it("세후영업이익을 투하자본으로 나눈다", () => {
    expect(
      roic(롯데쇼핑.영업이익, 0.118535, 27_920_364_380_374),
    ).toBeCloseTo(0.01727, 5);
  });

  it("투하자본이 0 이하면 정의되지 않는다", () => {
    expect(roic(100, 0.2, 0)).toBeNull();
    expect(roic(100, 0.2, -10)).toBeNull();
  });
});

describe("dupont", () => {
  it("ROE를 순이익률·자산회전율·재무레버리지로 분해한다", () => {
    const d = dupont({
      netIncome: 롯데쇼핑.당기순이익,
      sales: 롯데쇼핑.매출액,
      totalAssets: 롯데쇼핑.자산총계,
      totalEquity: 롯데쇼핑.자본총계,
    });

    expect(d).not.toBeNull();
    expect(d!.netMargin).toBeCloseTo(0.005354, 6);
    expect(d!.assetTurnover).toBeCloseTo(0.362391, 6);
    expect(d!.leverage).toBeCloseTo(2.247709, 6);
  });

  it("세 값을 곱하면 ROE와 같다", () => {
    const d = dupont({
      netIncome: 롯데쇼핑.당기순이익,
      sales: 롯데쇼핑.매출액,
      totalAssets: 롯데쇼핑.자산총계,
      totalEquity: 롯데쇼핑.자본총계,
    })!;

    expect(d.netMargin * d.assetTurnover * d.leverage).toBeCloseTo(
      롯데쇼핑.당기순이익 / 롯데쇼핑.자본총계,
      9,
    );
  });

  it("매출·자산·자본 중 하나라도 0 이하면 정의되지 않는다", () => {
    const base = {
      netIncome: 10,
      sales: 100,
      totalAssets: 200,
      totalEquity: 50,
    };
    expect(dupont({ ...base, sales: 0 })).toBeNull();
    expect(dupont({ ...base, totalAssets: 0 })).toBeNull();
    expect(dupont({ ...base, totalEquity: -1 })).toBeNull();
  });
});
