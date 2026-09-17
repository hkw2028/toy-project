import { describe, expect, it } from "vitest";

import {
  toYearlyFinancials,
  type SummaryRow,
} from "@/lib/compare/financials";

describe("toYearlyFinancials", () => {
  const row = (over: Partial<SummaryRow>): SummaryRow => ({
    bizYear: "2025",
    fnclDcdNm: "연결요약재무제표",
    enpSaleAmt: "100",
    enpBzopPft: "20",
    enpCrtmNpf: "10",
    enpTastAmt: "1000",
    enpTdbtAmt: "400",
    enpTcptAmt: "600",
    fnclDebtRto: "66.7",
    ...over,
  });

  it("숫자 필드를 숫자로 바꾼다", () => {
    const [y] = toYearlyFinancials([row({})]);

    expect(y).toMatchObject({
      bizYear: 2025,
      sales: 100,
      operatingIncome: 20,
      netIncome: 10,
      totalAssets: 1000,
      totalLiabilities: 400,
      totalEquity: 600,
      debtRatio: 66.7,
      basis: "consolidated",
    });
  });

  it("연도가 오름차순이 되도록 정렬한다", () => {
    const rows = [
      row({ bizYear: "2020" }),
      row({ bizYear: "2022" }),
      row({ bizYear: "2021" }),
    ];

    expect(toYearlyFinancials(rows).map((y) => y.bizYear)).toEqual([
      2020, 2021, 2022,
    ]);
  });

  it("한 연도에 연결과 별도가 함께 오면 연결을 쓴다", () => {
    const rows = [
      row({ bizYear: "2025", fnclDcdNm: "별도요약재무제표", enpSaleAmt: "1" }),
      row({ bizYear: "2025", fnclDcdNm: "연결요약재무제표", enpSaleAmt: "2" }),
    ];

    const [y] = toYearlyFinancials(rows);

    expect(y.sales).toBe(2);
    expect(y.basis).toBe("consolidated");
  });

  it("연결이 없으면 별도를 쓰고 그 사실을 기록한다", () => {
    const [y] = toYearlyFinancials([
      row({ fnclDcdNm: "별도요약재무제표" }),
    ]);

    expect(y.basis).toBe("separate");
  });

  it("숫자로 읽을 수 없는 값은 null로 둔다", () => {
    const [y] = toYearlyFinancials([row({ enpSaleAmt: undefined })]);

    expect(y.sales).toBeNull();
  });

  it("빈 입력이면 빈 배열을 준다", () => {
    expect(toYearlyFinancials([])).toEqual([]);
  });
});
