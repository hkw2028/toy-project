/**
 * 밸류에이션 지표.
 *
 * 분모가 0 이하라 값이 의미를 잃는 경우에는 0이나 음수를 돌려주지 않고 null을
 * 돌려준다. 읽을 수 없는 숫자를 화면에 내보내지 않기 위해서다.
 */

/** 시가총액 ÷ 당기순이익. 적자면 정의되지 않는다. */
export function per(marketCap: number, netIncome: number): number | null {
  if (netIncome <= 0) return null;
  return marketCap / netIncome;
}

/**
 * 시가총액 ÷ 지배기업 소유주지분.
 *
 * 자본총계를 쓰면 비지배지분이 섞여 자회사 지분이 큰 회사의 PBR이 실제보다
 * 낮게 나오므로 지배주주 몫만 분모로 쓴다.
 */
export function pbr(marketCap: number, equityOfParent: number): number | null {
  if (equityOfParent <= 0) return null;
  return marketCap / equityOfParent;
}

/**
 * 시가총액 + 부채총계 − 현금및현금성자산.
 *
 * 차입금 계정이 원천에서 여러 표준 ID로 흩어져 있어 순차입금을 정확히 구할 수
 * 없다. 부채총계에서 현금만 빼는 순부채로 근사한다.
 */
export function enterpriseValue(
  marketCap: number,
  totalLiabilities: number,
  cash: number,
): number {
  return marketCap + totalLiabilities - cash;
}

/** EV ÷ 영업이익. 영업손실이면 정의되지 않는다. */
export function evToEbit(
  enterpriseValue: number,
  operatingIncome: number,
): number | null {
  if (operatingIncome <= 0) return null;
  return enterpriseValue / operatingIncome;
}

/** (유동자산 − 부채총계) ÷ 시가총액. 그레이엄의 순유동자산 배수. */
export function ncavMultiple(
  currentAssets: number,
  totalLiabilities: number,
  marketCap: number,
): number | null {
  if (marketCap <= 0) return null;
  return (currentAssets - totalLiabilities) / marketCap;
}
