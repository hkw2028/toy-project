/**
 * 현금흐름으로 이익의 실체를 보는 지표.
 *
 * 장부이익은 회계 판단이 섞이지만 현금은 그렇지 않다. 두 값이 오래 어긋나는
 * 회사를 드러내는 것이 이 지표들의 목적이다.
 */

/** 영업활동현금흐름 − 유형자산 취득액. */
export function freeCashFlow(
  operatingCashFlow: number,
  capitalExpenditure: number,
): number {
  return operatingCashFlow - capitalExpenditure;
}

/**
 * 잉여현금흐름 ÷ 시가총액.
 *
 * 음수 잉여현금흐름도 그대로 보여준다. 현금을 태우고 있다는 사실 자체가
 * 읽어야 할 정보이기 때문이다.
 */
export function fcfYield(
  freeCashFlow: number,
  marketCap: number,
): number | null {
  if (marketCap <= 0) return null;
  return freeCashFlow / marketCap;
}

/**
 * (당기순이익 − 영업활동현금흐름) ÷ 자산총계.
 *
 * 값이 클수록 장부이익이 현금으로 뒷받침되지 않는다.
 */
export function accrualRatio(
  netIncome: number,
  operatingCashFlow: number,
  totalAssets: number,
): number | null {
  if (totalAssets <= 0) return null;
  return (netIncome - operatingCashFlow) / totalAssets;
}

/**
 * 영업활동현금흐름 ÷ 당기순이익.
 *
 * 1 미만이 이어지면 장부이익을 의심할 근거가 된다.
 */
export function earningsQuality(
  operatingCashFlow: number,
  netIncome: number,
): number | null {
  if (netIncome <= 0) return null;
  return operatingCashFlow / netIncome;
}
