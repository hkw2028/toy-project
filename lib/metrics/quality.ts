/**
 * 자본 효율과 이익의 구성을 보는 지표.
 */

/**
 * (세전이익 − 당기순이익) ÷ 세전이익.
 *
 * 값이 음수이거나 지나치게 크면 일회성 손익이 섞였다는 신호로 쓴다.
 */
export function effectiveTaxRate(
  pretaxIncome: number,
  netIncome: number,
): number | null {
  if (pretaxIncome <= 0) return null;
  return (pretaxIncome - netIncome) / pretaxIncome;
}

/**
 * 총자산 − 유동부채.
 *
 * 차입금 계정을 원천에서 일관되게 얻을 수 없어 영업에 묶인 자본을 이 식으로
 * 근사한다.
 */
export function investedCapital(
  totalAssets: number,
  currentLiabilities: number,
): number {
  return totalAssets - currentLiabilities;
}

/**
 * 세후영업이익 ÷ 투하자본.
 *
 * ROE와 달리 빚을 늘리는 것만으로는 올라가지 않는다.
 */
export function roic(
  operatingIncome: number,
  taxRate: number,
  investedCapital: number,
): number | null {
  if (investedCapital <= 0) return null;
  return (operatingIncome * (1 - taxRate)) / investedCapital;
}

export type DupontInput = {
  netIncome: number;
  sales: number;
  totalAssets: number;
  totalEquity: number;
};

export type Dupont = {
  /** 당기순이익 ÷ 매출액 */
  netMargin: number;
  /** 매출액 ÷ 자산총계 */
  assetTurnover: number;
  /** 자산총계 ÷ 자본총계 */
  leverage: number;
};

/**
 * ROE를 세 조각으로 나눈다. 세 값을 곱하면 ROE가 된다.
 *
 * 같은 ROE라도 마진에서 온 것인지, 회전율에서 온 것인지, 빚에서 온 것인지를
 * 가르기 위한 분해다.
 */
export function dupont({
  netIncome,
  sales,
  totalAssets,
  totalEquity,
}: DupontInput): Dupont | null {
  if (sales <= 0 || totalAssets <= 0 || totalEquity <= 0) return null;
  return {
    netMargin: netIncome / sales,
    assetTurnover: sales / totalAssets,
    leverage: totalAssets / totalEquity,
  };
}
