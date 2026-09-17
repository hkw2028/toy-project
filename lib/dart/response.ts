/**
 * OpenDART 응답 정규화.
 *
 * 이 API는 HTTP 상태가 아니라 본문의 `status` 코드로 결과를 알린다. 특히
 * `013`(조회된 데이터 없음)은 실패가 아니라 개별재무제표로 재시도하라는
 * 신호로 쓰이므로, 코드를 뭉개지 않고 그대로 보존한다.
 */

/**
 * 표본 30개 종목 전부에서 확인된 표준 계정 ID만 쓴다.
 *
 * 계정명은 회사마다 다르게 표기된다. 같은 차입금을 "차입금", "차입금및사채",
 * "단기차입금"으로 쓰기 때문에 이름으로 찾으면 종목마다 다른 값을 집게 된다.
 */
export const ACCOUNT = {
  cash: "ifrs-full_CashAndCashEquivalents",
  operatingCashFlow: "ifrs-full_CashFlowsFromUsedInOperatingActivities",
  capex:
    "ifrs-full_PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities",
  equityOfParent: "ifrs-full_EquityAttributableToOwnersOfParent",
} as const;

export type DartAccountRow = {
  account_id?: string;
  account_nm?: string;
  thstrm_amount?: string;
};

export type DartParsed =
  | { ok: true; list: DartAccountRow[] }
  | { ok: false; code: string; reason: string };

export function parseDartResponse(raw: unknown): DartParsed {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, code: "UNKNOWN", reason: "응답이 객체가 아닙니다" };
  }

  const { status, message, list } = raw as {
    status?: string;
    message?: string;
    list?: DartAccountRow[];
  };

  if (status !== "000") {
    return {
      ok: false,
      code: status ?? "UNKNOWN",
      reason: message ?? "알 수 없는 오류",
    };
  }

  return { ok: true, list: list ?? [] };
}

export type PickedAccounts = {
  cash: number | null;
  operatingCashFlow: number | null;
  capex: number | null;
  equityOfParent: number | null;
};

/** 표준 계정 ID로 당기 금액을 꺼낸다. */
export function pickAccounts(list: DartAccountRow[]): PickedAccounts {
  const byId = new Map<string, string>();
  for (const row of list) {
    if (row.account_id && !byId.has(row.account_id)) {
      byId.set(row.account_id, row.thstrm_amount ?? "");
    }
  }

  const read = (id: string) => toAmount(byId.get(id));

  return {
    cash: read(ACCOUNT.cash),
    operatingCashFlow: read(ACCOUNT.operatingCashFlow),
    capex: read(ACCOUNT.capex),
    equityOfParent: read(ACCOUNT.equityOfParent),
  };
}

/** `"1,723,750,652,721"` 같은 표기를 숫자로 바꾼다. */
function toAmount(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const cleaned = raw.replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
