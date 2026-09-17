/**
 * 모집단 안에서의 상대 위치.
 *
 * 백분위와 순위는 규칙으로 걸러내기 전의 전 종목을 모집단으로 삼는다. 규칙은
 * 이미 매겨진 값을 거를 뿐이므로, 규칙을 바꿔도 종목의 자리가 흔들리지 않는다.
 */

/**
 * 오름차순 백분위. 가장 작은 값이 0, 가장 큰 값이 100이다.
 *
 * 값이 클수록 좋은 지표(ROIC, FCF Yield, Altman Z)는 백분위 하한으로,
 * 작을수록 좋은 지표(EV/EBIT)는 백분위 상한으로 거르면 한 정의로 양쪽을
 * 모두 표현할 수 있다.
 */
export function percentileRanks(values: number[]): number[] {
  if (values.length === 0) return [];
  if (values.length === 1) return [0];

  const sorted = [...values].sort((a, b) => a - b);
  const denominator = values.length - 1;

  return values.map((v) => {
    const below = lowerBound(sorted, v);
    return (below / denominator) * 100;
  });
}

/** 정렬된 배열에서 v보다 작은 값의 개수. */
function lowerBound(sorted: number[], v: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export type RankInput = {
  id: string;
  evToEbit: number;
  roic: number;
};

export type Ranked = RankInput & {
  /** EV/EBIT 오름차순 순위와 ROIC 내림차순 순위의 합. 낮을수록 좋다. */
  rankScore: number;
  /** 합산 점수로 매긴 최종 순위. 1부터 시작하고 동점은 같은 값을 받는다. */
  rank: number;
};

/**
 * 마법공식 방식의 합산 순위.
 *
 * 싼 값과 높은 자본 효율 중 하나만 뛰어난 종목보다, 둘 다 무난한 종목이
 * 위로 오도록 두 순위를 더한다.
 */
export function combinedRank(items: RankInput[]): Ranked[] {
  if (items.length === 0) return [];

  const cheapFirst = ordinalRanks(items, (a, b) => a.evToEbit - b.evToEbit);
  const efficientFirst = ordinalRanks(items, (a, b) => b.roic - a.roic);

  const scored = items.map((item, i) => ({
    ...item,
    rankScore: cheapFirst[i] + efficientFirst[i],
  }));

  const sortedScores = [...scored]
    .map((s) => s.rankScore)
    .sort((a, b) => a - b);

  return scored.map((s) => ({
    ...s,
    rank: sortedScores.indexOf(s.rankScore) + 1,
  }));
}

/** 비교 함수 기준 1부터 시작하는 순위. 동점은 같은 순위를 받는다. */
function ordinalRanks<T>(
  items: T[],
  compare: (a: T, b: T) => number,
): number[] {
  const order = items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => compare(a.item, b.item));

  const ranks = new Array<number>(items.length);
  for (let pos = 0; pos < order.length; pos++) {
    const isTieWithPrevious =
      pos > 0 && compare(order[pos - 1].item, order[pos].item) === 0;
    ranks[order[pos].i] = isTieWithPrevious
      ? ranks[order[pos - 1].i]
      : pos + 1;
  }
  return ranks;
}
