import type { RankedItem, RawSearchParams } from "@/lib/screen/rules";

/**
 * 결과 표의 정렬.
 *
 * 규칙(무엇이 통과하는가)과는 별개 관심사다. 정렬은 이미 통과한 종목을
 * 어떤 차례로 보여줄지만 정하며, 종목마다 저장된 순위(rank)와 백분위 값
 * 자체는 건드리지 않는다.
 */

export const SORT_KEYS = [
  "name",
  "market",
  "marketCap",
  "evToEbit",
  "roic",
  "fcfYield",
  "per",
  "pbr",
  "altmanZ",
] as const;

export type SortKey = (typeof SORT_KEYS)[number];
export type SortDirection = "asc" | "desc";
export type SortSpec = { key: SortKey; direction: SortDirection };

/** 글자로 비교하는 열. 나머지는 숫자로 비교한다. */
const TEXT_KEYS = new Set<SortKey>(["name", "market"]);

export const DEFAULT_SORT: SortSpec = { key: "marketCap", direction: "desc" };

/** 정렬 상태도 규칙과 마찬가지로 URL에 남아 그대로 공유된다. */
export const SORT_QUERY_KEY = { key: "sort", direction: "dir" } as const;

/**
 * 아직 그 열로 정렬하고 있지 않을 때, 처음 눌렀을 때의 방향.
 *
 * 숫자 열은 큰 값이 먼저 보이는 편이 쓸모 있고, 이름과 시장은 가나다순이
 * 자연스럽다.
 */
export function initialDirectionFor(key: SortKey): SortDirection {
  return TEXT_KEYS.has(key) ? "asc" : "desc";
}

export function parseSort(searchParams: RawSearchParams): SortSpec {
  const key = first(searchParams[SORT_QUERY_KEY.key]);
  if (!isSortKey(key)) return DEFAULT_SORT;

  const direction = first(searchParams[SORT_QUERY_KEY.direction]);
  return {
    key,
    direction: isDirection(direction) ? direction : initialDirectionFor(key),
  };
}

/**
 * 헤더를 눌렀을 때 갈 주소.
 *
 * 지금 정렬 중인 열을 다시 누르면 방향을 뒤집고, 다른 열을 누르면 그 열의
 * 첫 클릭 방향으로 간다. 규칙 쿼리는 그대로 남겨 정렬만 바뀌게 한다.
 */
export function sortHref(
  searchParams: RawSearchParams,
  key: SortKey,
): string {
  const current = parseSort(searchParams);
  const direction =
    current.key === key ? flip(current.direction) : initialDirectionFor(key);

  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(searchParams)) {
    const single = first(value);
    if (single !== undefined) query.set(name, single);
  }
  query.set(SORT_QUERY_KEY.key, key);
  query.set(SORT_QUERY_KEY.direction, direction);

  return `?${query.toString()}`;
}

/**
 * 통과 종목을 정렬한다.
 *
 * 값이 같으면 순위가 앞선 종목을 먼저 두어, 같은 주소를 다시 열었을 때 늘
 * 같은 차례가 나오게 한다.
 */
export function sortItems(
  items: RankedItem[],
  sort: SortSpec,
): RankedItem[] {
  const sign = sort.direction === "asc" ? 1 : -1;

  return [...items].sort((a, b) => {
    const compared = TEXT_KEYS.has(sort.key)
      ? textOf(a, sort.key).localeCompare(textOf(b, sort.key), "ko")
      : numberOf(a, sort.key) - numberOf(b, sort.key);

    return compared !== 0 ? compared * sign : a.rank - b.rank;
  });
}

function textOf(item: RankedItem, key: SortKey): string {
  return key === "market" ? item.market : item.name;
}

function numberOf(item: RankedItem, key: SortKey): number {
  // Altman Z는 절대 기준선을 쓰지 않기로 했으므로 화면에 보이는 백분위로
  // 정렬한다. 나머지는 표에 그대로 보이는 값으로 정렬한다.
  if (key === "altmanZ") return item.percentile.altmanZ;
  if (key === "marketCap") return item.marketCap;
  if (key === "evToEbit") return item.evToEbit;
  if (key === "roic") return item.roic;
  if (key === "fcfYield") return item.fcfYield;
  if (key === "per") return item.per;
  return item.pbr;
}

function flip(direction: SortDirection): SortDirection {
  return direction === "asc" ? "desc" : "asc";
}

function first(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

function isSortKey(value: string | undefined): value is SortKey {
  return value !== undefined && (SORT_KEYS as readonly string[]).includes(value);
}

function isDirection(value: string | undefined): value is SortDirection {
  return value === "asc" || value === "desc";
}
