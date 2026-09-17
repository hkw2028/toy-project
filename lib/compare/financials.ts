import {
  FSC_ENDPOINT,
  fetchFsc,
} from "@/lib/fsc/client";
import { pickPreferredStatement, type StatementBasis } from "@/lib/fsc/response";

export type SummaryRow = {
  bizYear?: string;
  fnclDcdNm?: string;
  enpSaleAmt?: string;
  enpBzopPft?: string;
  enpCrtmNpf?: string;
  enpTastAmt?: string;
  enpTdbtAmt?: string;
  enpTcptAmt?: string;
  fnclDebtRto?: string;
};

export type YearlyFinancials = {
  bizYear: number;
  sales: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  debtRatio: number | null;
  /** 그 연도에 연결요약재무제표와 별도요약재무제표 중 어느 쪽을 썼는지. */
  basis: StatementBasis;
};

/**
 * 사업연도를 생략해 받은 여러 해·여러 재무제표 기준의 응답을, 연도 하나당
 * 한 줄로 정리한다.
 *
 * 같은 연도에 연결과 별도가 함께 오면 연결을 우선한다(스크리너와 같은
 * 기준, `pickPreferredStatement` 재사용).
 */
export function toYearlyFinancials(rows: SummaryRow[]): YearlyFinancials[] {
  const byYear = new Map<string, SummaryRow[]>();
  for (const row of rows) {
    if (!row.bizYear) continue;
    const list = byYear.get(row.bizYear);
    if (list) list.push(row);
    else byYear.set(row.bizYear, [row]);
  }

  const years: YearlyFinancials[] = [];
  for (const [bizYear, group] of byYear) {
    const picked = pickPreferredStatement(group);
    if (!picked) continue;

    years.push({
      bizYear: Number(bizYear),
      sales: num(picked.row.enpSaleAmt),
      operatingIncome: num(picked.row.enpBzopPft),
      netIncome: num(picked.row.enpCrtmNpf),
      totalAssets: num(picked.row.enpTastAmt),
      totalLiabilities: num(picked.row.enpTdbtAmt),
      totalEquity: num(picked.row.enpTcptAmt),
      debtRatio: num(picked.row.fnclDebtRto),
      basis: picked.basis,
    });
  }

  return years.sort((a, b) => a.bizYear - b.bizYear);
}

function num(v: string | undefined): number | null {
  if (v === undefined) return null;
  const cleaned = v.replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * 한 기업의 재무 추이를 가져온다.
 *
 * 사업연도를 생략하면 그 기업이 가진 전체 연도를 한 번에 돌려준다(최대
 * 11년치, 2015년부터). 담긴 기업 하나당 이 호출 한 번이면 된다.
 */
export async function fetchCompanyFinancials(
  crno: string,
  key: string,
): Promise<YearlyFinancials[] | { error: string }> {
  const r = await fetchFsc<SummaryRow>(
    FSC_ENDPOINT.summaryFinancials,
    { crno, numOfRows: 10_000, pageNo: 1 },
    key,
  );

  if (!r.ok) return { error: `[${r.code}] ${r.reason}` };
  if (r.items.length === 0) return { error: "재무제표가 없습니다" };
  return toYearlyFinancials(r.items);
}
