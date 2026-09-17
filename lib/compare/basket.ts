export type RawSearchParams = Record<string, string | string[] | undefined>;

/** 바구니 항목 하나. 재무제표 응답에는 법인명이 없어 검색 시점의 이름을 함께 들고 다닌다. */
export type BasketEntry = { crno: string; name: string };

/** 바구니에 담을 수 있는 최대 기업 수. */
export const MAX_BASKET_SIZE = 4;

const QUERY_KEY = "basket";

/**
 * URL 쿼리에서 바구니를 읽는다.
 *
 * 각 항목은 `법인등록번호:이름`이고 쉼표로 구분된다. 이름은 URL 인코딩돼
 * 있어 콜론·쉼표가 들어 있어도 안전하다. 중복과 빈 조각을 제거한 뒤 최대
 * 개수로 자른다. 담긴 기업의 실제 존재 여부는 여기서 확인하지 않는다.
 */
export function parseBasket(searchParams: RawSearchParams): BasketEntry[] {
  const raw = first(searchParams[QUERY_KEY]);
  if (!raw) return [];

  const seen = new Set<string>();
  const entries: BasketEntry[] = [];

  for (const chunk of raw.split(",")) {
    if (!chunk) continue;
    const sep = chunk.indexOf(":");
    const crno = sep === -1 ? chunk : chunk.slice(0, sep);
    const name = sep === -1 ? "" : decodeURIComponent(chunk.slice(sep + 1));
    if (!crno || seen.has(crno)) continue;
    seen.add(crno);
    entries.push({ crno, name });
  }

  return entries.slice(0, MAX_BASKET_SIZE);
}

/**
 * 바구니에 기업을 하나 더 담은 주소.
 *
 * 이미 담겨 있거나 바구니가 꽉 찼으면 조용히 그대로 둔다. 다른 쿼리(검색어
 * 등)는 그대로 보존한다.
 */
export function addToBasketHref(
  searchParams: RawSearchParams,
  crno: string,
  name: string,
): string {
  const current = parseBasket(searchParams);
  const next =
    current.some((e) => e.crno === crno) || current.length >= MAX_BASKET_SIZE
      ? current
      : [...current, { crno, name }];

  return buildHref(searchParams, next);
}

/** 바구니에서 기업 하나를 뺀 주소. 다른 쿼리는 그대로 보존한다. */
export function removeFromBasketHref(
  searchParams: RawSearchParams,
  crno: string,
): string {
  const next = parseBasket(searchParams).filter((e) => e.crno !== crno);
  return buildHref(searchParams, next);
}

function buildHref(
  searchParams: RawSearchParams,
  basket: BasketEntry[],
): string {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(searchParams)) {
    if (name === QUERY_KEY) continue;
    const single = first(value);
    if (single !== undefined) query.set(name, single);
  }
  query.set(
    QUERY_KEY,
    basket.map((e) => `${e.crno}:${encodeURIComponent(e.name)}`).join(","),
  );
  return `?${query.toString()}`;
}

function first(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}
