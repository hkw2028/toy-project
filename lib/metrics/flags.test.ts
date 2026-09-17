import { describe, expect, it } from "vitest";

import { anomalyFlags } from "@/lib/metrics/flags";

const 정상 = {
  effectiveTaxRate: 0.22,
  per: 12,
  netIncome: 1000,
  previousNetIncome: 900,
  earningsQuality: 1.3,
};

describe("anomalyFlags", () => {
  it("정상 범위에서는 아무 경고도 붙지 않는다", () => {
    expect(anomalyFlags(정상)).toEqual([]);
  });

  it("실효법인세율이 음수이면 경고한다", () => {
    expect(anomalyFlags({ ...정상, effectiveTaxRate: -0.01 })).toContain(
      "tax-rate-out-of-range",
    );
  });

  it("실효법인세율이 50%를 넘으면 경고한다", () => {
    expect(anomalyFlags({ ...정상, effectiveTaxRate: 0.51 })).toContain(
      "tax-rate-out-of-range",
    );
    expect(anomalyFlags({ ...정상, effectiveTaxRate: 0.5 })).not.toContain(
      "tax-rate-out-of-range",
    );
  });

  it("PER이 2 미만이면 경고한다", () => {
    expect(anomalyFlags({ ...정상, per: 1.9 })).toContain("per-too-low");
    expect(anomalyFlags({ ...정상, per: 2 })).not.toContain("per-too-low");
  });

  it("당기순이익이 전년 대비 3배를 넘게 변하면 경고한다", () => {
    expect(
      anomalyFlags({ ...정상, netIncome: 3100, previousNetIncome: 1000 }),
    ).toContain("earnings-swing");
    expect(
      anomalyFlags({ ...정상, netIncome: 2900, previousNetIncome: 1000 }),
    ).not.toContain("earnings-swing");
  });

  it("흑자에서 적자로 돌아선 것도 급변으로 본다", () => {
    expect(
      anomalyFlags({ ...정상, netIncome: -500, previousNetIncome: 1000 }),
    ).toContain("earnings-swing");
  });

  it("이익의 질이 1 미만이면 경고한다", () => {
    expect(anomalyFlags({ ...정상, earningsQuality: 0.9 })).toContain(
      "low-earnings-quality",
    );
    expect(anomalyFlags({ ...정상, earningsQuality: 1 })).not.toContain(
      "low-earnings-quality",
    );
  });

  it("판정에 필요한 값이 없으면 그 경고는 붙지 않는다", () => {
    expect(
      anomalyFlags({
        effectiveTaxRate: null,
        per: null,
        netIncome: 1000,
        previousNetIncome: null,
        earningsQuality: null,
      }),
    ).toEqual([]);
  });

  it("여러 조건에 걸리면 모두 붙는다", () => {
    expect(
      anomalyFlags({ ...정상, per: 1, earningsQuality: 0.5 }),
    ).toEqual(["per-too-low", "low-earnings-quality"]);
  });
});
