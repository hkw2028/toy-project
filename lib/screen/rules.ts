import type { SnapshotItem } from "@/lib/universe/build";

/**
 * 스크리너 규칙.
 *
 * 백분위 상한·하한은 스냅샷 생성 시점에 이미 매겨진 값을 거를 뿐이다. 규칙을
 * 바꿔도 종목의 순위와 백분위 자체는 흔들리지 않는다.
 */
export type ScreenRules = {
  /** EV/EBIT 백분위 상한. 이 값 이하(쌀수록 좋음)만 통과한다. */
  evEbitMaxPercentile: number;
  /** ROIC 백분위 하한. 이 값 이상만 통과한다. */
  roicMinPercentile: number;
  /** FCF Yield 백분위 하한. */
  fcfYieldMinPercentile: number;
  /** Altman Z 백분위 하한. */
  altmanZMinPercentile: number;
  /** 통과 종목 중 상위 몇 개까지 보여줄지. */
  resultCount: number;
};

const DEFAULTS: ScreenRules = {
  evEbitMaxPercentile: 50,
  roicMinPercentile: 50,
  fcfYieldMinPercentile: 50,
  altmanZMinPercentile: 30,
  resultCount: 20,
};

/** searchParams 쿼리 키. URL에 그대로 남아 규칙을 공유하는 값이 된다. */
export const QUERY_KEY = {
  evEbitMaxPercentile: "evebit",
  roicMinPercentile: "roic",
  fcfYieldMinPercentile: "fcf",
  altmanZMinPercentile: "z",
  resultCount: "n",
} as const;

export type RawSearchParams = Record<string, string | string[] | undefined>;

/**
 * Next.js의 `searchParams`(문자열 또는 문자열 배열)를 규칙으로 바꾼다.
 *
 * 빠졌거나 숫자로 읽을 수 없는 값은 기본값으로 되돌리고, 범위를 벗어난 값은
 * 잘라낸다. 잘못된 쿼리 문자열 하나 때문에 페이지가 깨지지 않게 하기 위해서다.
 */
export function parseRules(searchParams: RawSearchParams): ScreenRules {
  const percentile = (key: keyof typeof QUERY_KEY) =>
    clampPercentile(readNumber(searchParams[QUERY_KEY[key]], DEFAULTS[key]));

  return {
    evEbitMaxPercentile: percentile("evEbitMaxPercentile"),
    roicMinPercentile: percentile("roicMinPercentile"),
    fcfYieldMinPercentile: percentile("fcfYieldMinPercentile"),
    altmanZMinPercentile: percentile("altmanZMinPercentile"),
    resultCount: clampResultCount(
      readNumber(searchParams[QUERY_KEY.resultCount], DEFAULTS.resultCount),
    ),
  };
}

function readNumber(
  raw: string | string[] | undefined,
  fallback: number,
): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampPercentile(n: number): number {
  return Math.min(100, Math.max(0, n));
}

function clampResultCount(n: number): number {
  return Math.min(200, Math.max(1, Math.floor(n)));
}

/**
 * 순위가 매겨진 종목. `percentile`이 있는 종목은 11개 지표(하위 필드 포함
 * 13개)가 모두 계산돼 있다는 것이 스냅샷 생성 쪽의 불변식이므로, 그 필드들을
 * 화면에서 다시 null 체크하지 않도록 타입으로 좁혀 둔다.
 */
export type RankedItem = SnapshotItem & {
  percentile: NonNullable<SnapshotItem["percentile"]>;
  rank: number;
  rankScore: number;
  per: number;
  pbr: number;
  evToEbit: number;
  roic: number;
  fcfYield: number;
  accrualRatio: number;
  earningsQuality: number;
  ncavMultiple: number;
  netMargin: number;
  assetTurnover: number;
  leverage: number;
  effectiveTaxRate: number;
};

function isRanked(item: SnapshotItem): item is RankedItem {
  return item.percentile !== null;
}

export type ScreenResult = {
  /** 규칙을 적용하기 전, 지표가 계산된 전 종목 수. */
  population: number;
  /** 규칙을 통과해 실제로 보여줄 종목. */
  passed: RankedItem[];
};

/**
 * 전 종목에 규칙을 적용해 통과 종목을 순위순으로 자른다.
 *
 * 지표가 계산되지 않은(percentile이 없는) 종목은 모집단에서도 제외한다.
 * 규칙으로 거르는 대상은 이미 순위가 매겨진 종목뿐이다.
 */
export function applyRules(
  items: SnapshotItem[],
  rules: ScreenRules,
): ScreenResult {
  const ranked = items.filter(isRanked);

  const passed = ranked
    .filter(
      (item) =>
        item.percentile.evToEbit <= rules.evEbitMaxPercentile &&
        item.percentile.roic >= rules.roicMinPercentile &&
        item.percentile.fcfYield >= rules.fcfYieldMinPercentile &&
        item.percentile.altmanZ >= rules.altmanZMinPercentile,
    )
    .sort((a, b) => a.rank - b.rank)
    .slice(0, rules.resultCount);

  return { population: ranked.length, passed };
}

/**
 * 순위 대상에서 빠진 종목을 사유별로 센다.
 *
 * 결과 표는 통과 종목만 보여주므로, 제외된 종목의 사유는 이렇게 집계로만
 * 확인할 수 있다. 개별 종목을 찾아보는 기능은 이 화면의 범위 밖이다.
 */
export function summarizeExclusions(
  items: SnapshotItem[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    if (!item.excludedReason) continue;
    counts[item.excludedReason] = (counts[item.excludedReason] ?? 0) + 1;
  }
  return counts;
}
