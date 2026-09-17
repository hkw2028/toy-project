/**
 * 재무 위험 지표.
 */

/** 유동자산 − 유동부채. */
export function workingCapital(
  currentAssets: number,
  currentLiabilities: number,
): number {
  return currentAssets - currentLiabilities;
}

export type AltmanZInput = {
  workingCapital: number;
  retainedEarnings: number;
  operatingIncome: number;
  marketCap: number;
  totalLiabilities: number;
  sales: number;
  totalAssets: number;
};

/**
 * Altman Z-Score.
 *
 * 계수는 미국 제조업 상장사를 기준으로 만들어졌다. 이 모집단에는 금융업과
 * 지주회사가 섞여 있고 원천에 업종 분류가 사실상 없어 제조업 여부를 가릴 수
 * 없으므로, 이 값은 1.8이나 3.0 같은 절대 기준선으로 읽지 말고 모집단 안의
 * 상대 순위로만 써야 한다.
 */
export function altmanZ({
  workingCapital,
  retainedEarnings,
  operatingIncome,
  marketCap,
  totalLiabilities,
  sales,
  totalAssets,
}: AltmanZInput): number | null {
  if (totalAssets <= 0 || totalLiabilities <= 0) return null;
  return (
    1.2 * (workingCapital / totalAssets) +
    1.4 * (retainedEarnings / totalAssets) +
    3.3 * (operatingIncome / totalAssets) +
    0.6 * (marketCap / totalLiabilities) +
    1.0 * (sales / totalAssets)
  );
}
