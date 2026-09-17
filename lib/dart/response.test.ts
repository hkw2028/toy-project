import { describe, expect, it } from "vitest";

import { ACCOUNT, parseDartResponse, pickAccounts } from "@/lib/dart/response";

describe("parseDartResponse", () => {
  it("정상 응답에서 계정 목록을 꺼낸다", () => {
    const r = parseDartResponse({
      status: "000",
      message: "정상",
      list: [{ account_id: "ifrs-full_Assets", thstrm_amount: "100" }],
    });

    expect(r.ok).toBe(true);
    expect(r.ok && r.list).toHaveLength(1);
  });

  it("조회된 데이터가 없으면 오류로 보되 그 코드를 보존한다", () => {
    // 연결재무제표가 없어 개별로 재시도해야 하는 경우가 013으로 온다.
    const r = parseDartResponse({ status: "013", message: "조회된 데이타가 없습니다." });

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("013");
  });

  it("등록되지 않은 키는 그 코드로 구분된다", () => {
    const r = parseDartResponse({ status: "010", message: "등록되지 않은 키입니다." });

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("010");
    expect(r.reason).toContain("등록되지 않은 키");
  });

  it("알 수 없는 모양이면 오류로 본다", () => {
    expect(parseDartResponse(null).ok).toBe(false);
  });
});

describe("pickAccounts", () => {
  // 계정명은 회사마다 다르게 표기되므로 표준 계정 ID로만 찾는다.
  const list = [
    {
      account_id: ACCOUNT.cash,
      account_nm: "현금및현금성자산",
      thstrm_amount: "571,525,104,252",
    },
    {
      account_id: ACCOUNT.operatingCashFlow,
      account_nm: "영업활동으로 인한 현금흐름",
      thstrm_amount: "1,723,750,652,721",
    },
    {
      account_id: ACCOUNT.capex,
      account_nm: "유형자산의 취득",
      thstrm_amount: "651,764,091,594",
    },
    {
      account_id: ACCOUNT.equityOfParent,
      account_nm: "지배기업 소유주지분",
      thstrm_amount: "15,185,023,750,402",
    },
  ];

  it("표준 계정 ID로 값을 찾고 천 단위 쉼표를 숫자로 바꾼다", () => {
    expect(pickAccounts(list)).toEqual({
      cash: 571_525_104_252,
      operatingCashFlow: 1_723_750_652_721,
      capex: 651_764_091_594,
      equityOfParent: 15_185_023_750_402,
    });
  });

  it("계정명이 달라도 표준 ID가 같으면 찾아낸다", () => {
    const 이름이다름 = [
      { account_id: ACCOUNT.cash, account_nm: "현금", thstrm_amount: "100" },
    ];

    expect(pickAccounts(이름이다름).cash).toBe(100);
  });

  it("표준 ID가 없는 계정은 이름이 비슷해도 쓰지 않는다", () => {
    const 표준아님 = [
      {
        account_id: "-표준계정코드 미사용-",
        account_nm: "현금및현금성자산",
        thstrm_amount: "999",
      },
    ];

    expect(pickAccounts(표준아님).cash).toBeNull();
  });

  it("음수 표기를 숫자로 바꾼다", () => {
    const 음수 = [
      {
        account_id: ACCOUNT.operatingCashFlow,
        account_nm: "영업활동현금흐름",
        thstrm_amount: "-1,234",
      },
    ];

    expect(pickAccounts(음수).operatingCashFlow).toBe(-1234);
  });

  it("값이 비어 있으면 null로 둔다", () => {
    const 빈값 = [
      { account_id: ACCOUNT.cash, account_nm: "현금", thstrm_amount: "" },
    ];

    expect(pickAccounts(빈값).cash).toBeNull();
  });
});
