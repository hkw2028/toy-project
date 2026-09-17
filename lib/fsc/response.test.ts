import { describe, expect, it } from "vitest";

import {
  parseFscResponse,
  pickLatestByBasDt,
  pickPreferredStatement,
} from "@/lib/fsc/response";

describe("parseFscResponse", () => {
  it("정상 응답에서 항목과 전체 건수를 꺼낸다", () => {
    const raw = {
      response: {
        header: { resultCode: "00", resultMsg: "NORMAL SERVICE." },
        body: {
          numOfRows: 1,
          pageNo: 1,
          totalCount: 2,
          items: { item: [{ crno: "1101110000086" }] },
        },
      },
    };

    const r = parseFscResponse<{ crno: string }>(raw);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.totalCount).toBe(2);
    expect(r.items).toEqual([{ crno: "1101110000086" }]);
  });

  it("항목이 하나일 때 객체로 와도 배열로 돌려준다", () => {
    const raw = {
      response: {
        header: { resultCode: "00", resultMsg: "NORMAL SERVICE." },
        body: { totalCount: 1, items: { item: { crno: "1" } } },
      },
    };

    const r = parseFscResponse<{ crno: string }>(raw);

    expect(r.ok && r.items).toEqual([{ crno: "1" }]);
  });

  it("조회 결과가 없으면 빈 배열을 준다", () => {
    const raw = {
      response: {
        header: { resultCode: "00", resultMsg: "NORMAL SERVICE." },
        body: { totalCount: 0, items: "" },
      },
    };

    const r = parseFscResponse(raw);

    expect(r.ok && r.items).toEqual([]);
  });

  it("인증 실패는 정상과 다른 봉투로 오며 이를 오류로 구분한다", () => {
    // 인증 실패 시 response.header가 아예 없고 최상위 키부터 다르다.
    const raw = {
      OpenAPI_ServiceResponse: {
        cmmMsgHeader: {
          errMsg: "SERVICE_KEY_IS_NOT_REGISTERED_ERROR",
          returnAuthMsg: "등록되지 않은 서비스키",
          returnReasonCode: "30",
        },
      },
    };

    const r = parseFscResponse(raw);

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("30");
    expect(r.reason).toContain("SERVICE_KEY_IS_NOT_REGISTERED_ERROR");
  });

  it("resultCode가 00이 아니면 오류로 본다", () => {
    const raw = {
      response: {
        header: { resultCode: "99", resultMsg: "SERVICE ERROR" },
        body: {},
      },
    };

    const r = parseFscResponse(raw);

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("99");
  });

  it("알 수 없는 모양이면 오류로 본다", () => {
    expect(parseFscResponse(null).ok).toBe(false);
    expect(parseFscResponse("<html>error</html>").ok).toBe(false);
  });
});

describe("pickLatestByBasDt", () => {
  // 한 종목에 기준일만 다른 스냅샷이 여러 건 쌓여 있다.
  const rows = [
    { basDt: "20210314", itmsNm: "롯데쇼핑" },
    { basDt: "20260916", itmsNm: "롯데쇼핑" },
    { basDt: "20240315", itmsNm: "롯데쇼핑" },
  ];

  it("기준일이 가장 늦은 한 건만 남긴다", () => {
    expect(pickLatestByBasDt(rows)).toEqual({
      basDt: "20260916",
      itmsNm: "롯데쇼핑",
    });
  });

  it("빈 입력이면 null을 준다", () => {
    expect(pickLatestByBasDt([])).toBeNull();
  });
});

describe("pickPreferredStatement", () => {
  it("연결이 있으면 연결을 고르고 그 사실을 함께 준다", () => {
    const r = pickPreferredStatement([
      { fnclDcdNm: "별도요약재무제표", v: 1 },
      { fnclDcdNm: "연결요약재무제표", v: 2 },
    ]);

    expect(r).toEqual({
      row: { fnclDcdNm: "연결요약재무제표", v: 2 },
      basis: "consolidated",
    });
  });

  it("연결이 없으면 별도를 고르고 그 사실을 함께 준다", () => {
    const r = pickPreferredStatement([{ fnclDcdNm: "별도요약재무제표", v: 1 }]);

    expect(r).toEqual({
      row: { fnclDcdNm: "별도요약재무제표", v: 1 },
      basis: "separate",
    });
  });

  it("빈 입력이면 null을 준다", () => {
    expect(pickPreferredStatement([])).toBeNull();
  });
});
