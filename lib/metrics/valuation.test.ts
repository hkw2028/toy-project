import { describe, expect, it } from "vitest";

import {
  enterpriseValue,
  evToEbit,
  ncavMultiple,
  pbr,
  per,
} from "@/lib/metrics/valuation";

// 롯데쇼핑(023530) 2025 사업연도 실제 원천값.
// 시가총액은 2025-12-30 종가 기준, 재무는 연결요약재무제표 기준이다.
const 롯데쇼핑 = {
  시가총액: 2_050_934_737_500,
  당기순이익: 73_555_557_525,
  지배주주지분: 15_185_023_750_402,
  부채총계: 21_044_102_609_491,
  현금: 571_525_104_252,
  영업이익: 547_037_221_095,
  유동자산: 5_195_038_635_804,
};

describe("per", () => {
  it("시가총액을 당기순이익으로 나눈다", () => {
    expect(per(롯데쇼핑.시가총액, 롯데쇼핑.당기순이익)).toBeCloseTo(27.882798, 5);
  });

  it("당기순이익이 0 이하면 정의되지 않는다", () => {
    expect(per(1000, 0)).toBeNull();
    expect(per(1000, -500)).toBeNull();
  });
});

describe("pbr", () => {
  it("분모로 자본총계가 아니라 지배기업 소유주지분을 쓴다", () => {
    expect(pbr(롯데쇼핑.시가총액, 롯데쇼핑.지배주주지분)).toBeCloseTo(0.135063, 5);
  });

  it("지배기업 소유주지분이 0 이하면 정의되지 않는다", () => {
    expect(pbr(1000, 0)).toBeNull();
    expect(pbr(1000, -1)).toBeNull();
  });
});

describe("enterpriseValue", () => {
  it("시가총액에 부채총계를 더하고 현금을 뺀 순부채 근사를 쓴다", () => {
    expect(
      enterpriseValue(롯데쇼핑.시가총액, 롯데쇼핑.부채총계, 롯데쇼핑.현금),
    ).toBe(22_523_512_242_739);
  });
});

describe("evToEbit", () => {
  it("EV를 영업이익으로 나눈다", () => {
    expect(evToEbit(22_523_512_242_739, 롯데쇼핑.영업이익)).toBeCloseTo(
      41.173638,
      5,
    );
  });

  it("영업이익이 0 이하면 정의되지 않는다", () => {
    expect(evToEbit(1000, 0)).toBeNull();
    expect(evToEbit(1000, -1)).toBeNull();
  });
});

describe("ncavMultiple", () => {
  it("유동자산에서 부채총계를 뺀 값을 시가총액으로 나눈다", () => {
    expect(
      ncavMultiple(롯데쇼핑.유동자산, 롯데쇼핑.부채총계, 롯데쇼핑.시가총액),
    ).toBeCloseTo(-7.727727, 5);
  });

  it("시가총액이 0 이하면 정의되지 않는다", () => {
    expect(ncavMultiple(100, 50, 0)).toBeNull();
  });
});
