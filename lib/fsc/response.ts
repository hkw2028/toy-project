/**
 * 금융위원회 오픈API 응답 정규화.
 *
 * 이 API는 성공과 실패가 서로 다른 봉투로 온다. 성공은 `response.header`,
 * 인증 실패는 `OpenAPI_ServiceResponse.cmmMsgHeader`다. 호출부마다 이 분기를
 * 반복하면 인증 실패를 조용히 놓치게 되므로 여기서 한 번만 흡수한다.
 */

export type FscParsed<T> =
  | { ok: true; items: T[]; totalCount: number }
  | { ok: false; code: string; reason: string };

export function parseFscResponse<T>(raw: unknown): FscParsed<T> {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, code: "UNKNOWN", reason: "응답이 객체가 아닙니다" };
  }

  const record = raw as Record<string, unknown>;

  const fault = record.OpenAPI_ServiceResponse as
    | { cmmMsgHeader?: Record<string, string> }
    | undefined;
  if (fault?.cmmMsgHeader) {
    const h = fault.cmmMsgHeader;
    return {
      ok: false,
      code: h.returnReasonCode ?? "UNKNOWN",
      reason: `${h.errMsg ?? "알 수 없는 오류"} (${h.returnAuthMsg ?? ""})`.trim(),
    };
  }

  const response = record.response as
    | {
        header?: { resultCode?: string; resultMsg?: string };
        body?: { totalCount?: number | string; items?: unknown };
      }
    | undefined;
  if (!response?.header) {
    return { ok: false, code: "UNKNOWN", reason: "알 수 없는 응답 형식입니다" };
  }

  const { resultCode, resultMsg } = response.header;
  if (resultCode !== "00") {
    return {
      ok: false,
      code: resultCode ?? "UNKNOWN",
      reason: resultMsg ?? "결과 코드가 정상이 아닙니다",
    };
  }

  return {
    ok: true,
    items: toItemArray<T>(response.body?.items),
    totalCount: Number(response.body?.totalCount ?? 0),
  };
}

/** 항목이 하나면 객체로, 없으면 빈 문자열로 오는 경우를 배열로 고른다. */
function toItemArray<T>(items: unknown): T[] {
  if (Array.isArray(items)) return items as T[];
  if (typeof items !== "object" || items === null) return [];
  const item = (items as { item?: unknown }).item;
  if (Array.isArray(item)) return item as T[];
  if (item && typeof item === "object") return [item as T];
  return [];
}

/**
 * 기준일만 다른 스냅샷이 여러 건 쌓이는 응답에서 가장 늦은 한 건을 고른다.
 *
 * 이 처리를 빼면 한 종목이 검색 결과에 수십 번 나온다.
 */
export function pickLatestByBasDt<T extends { basDt?: string }>(
  rows: T[],
): T | null {
  let latest: T | null = null;
  for (const row of rows) {
    if (!latest || (row.basDt ?? "") > (latest.basDt ?? "")) latest = row;
  }
  return latest;
}

export type StatementBasis = "consolidated" | "separate";

/**
 * 연결재무제표를 우선 고르고, 없으면 별도재무제표를 고른다.
 *
 * 어느 쪽을 골랐는지 함께 돌려준다. 두 기준이 섞인 모집단에서 값을 읽으려면
 * 출처가 화면까지 따라가야 하기 때문이다.
 */
export function pickPreferredStatement<T extends { fnclDcdNm?: string }>(
  rows: T[],
): { row: T; basis: StatementBasis } | null {
  const consolidated = rows.find((r) => r.fnclDcdNm?.includes("연결"));
  if (consolidated) return { row: consolidated, basis: "consolidated" };

  const separate = rows.find((r) => r.fnclDcdNm?.includes("별도"));
  if (separate) return { row: separate, basis: "separate" };

  return null;
}
