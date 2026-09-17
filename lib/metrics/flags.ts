/**
 * 이상치 판정.
 *
 * 걸린 종목을 목록에서 빼지 않는다. 지우면 사용자가 판단할 기회를 잃는다.
 * 대신 왜 의심스러운지를 함께 내보낸다.
 */

export type AnomalyFlag =
  | "tax-rate-out-of-range"
  | "per-too-low"
  | "earnings-swing"
  | "low-earnings-quality";

export type AnomalyInput = {
  effectiveTaxRate: number | null;
  per: number | null;
  netIncome: number;
  previousNetIncome: number | null;
  earningsQuality: number | null;
};

/** 전년 대비 순이익이 이 배수를 넘게 변하면 급변으로 본다. */
const EARNINGS_SWING_MULTIPLE = 3;

export function anomalyFlags({
  effectiveTaxRate,
  per,
  netIncome,
  previousNetIncome,
  earningsQuality,
}: AnomalyInput): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];

  // 세율이 음수이거나 지나치게 높으면 일회성 손익이 섞였을 가능성이 크다.
  if (effectiveTaxRate !== null && (effectiveTaxRate < 0 || effectiveTaxRate > 0.5)) {
    flags.push("tax-rate-out-of-range");
  }

  if (per !== null && per < 2) {
    flags.push("per-too-low");
  }

  if (previousNetIncome !== null && previousNetIncome !== 0) {
    const 부호가바뀜 = netIncome * previousNetIncome < 0;
    const 배수 = Math.abs(netIncome / previousNetIncome);
    if (부호가바뀜 || 배수 > EARNINGS_SWING_MULTIPLE) {
      flags.push("earnings-swing");
    }
  }

  if (earningsQuality !== null && earningsQuality < 1) {
    flags.push("low-earnings-quality");
  }

  return flags;
}
