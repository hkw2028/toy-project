import { describe, expect, it } from "vitest";

import {
  addToBasketHref,
  MAX_BASKET_SIZE,
  parseBasket,
  removeFromBasketHref,
} from "@/lib/compare/basket";

describe("parseBasket", () => {
  it("쿼리가 없으면 빈 바구니다", () => {
    expect(parseBasket({})).toEqual([]);
  });

  it("법인등록번호:이름 쌍을 쉼표로 구분해 읽는다", () => {
    expect(parseBasket({ basket: "A:삼성전자,B:SK하이닉스" })).toEqual([
      { crno: "A", name: "삼성전자" },
      { crno: "B", name: "SK하이닉스" },
    ]);
  });

  it("이름에 든 콜론·쉼표도 안전하게 복원한다(URL 인코딩)", () => {
    const encoded = `A:${encodeURIComponent("어떤:회사,이름")}`;
    expect(parseBasket({ basket: encoded })).toEqual([
      { crno: "A", name: "어떤:회사,이름" },
    ]);
  });

  it("같은 법인등록번호가 중복되면 한 번만 남긴다", () => {
    expect(
      parseBasket({ basket: "A:삼성전자,A:삼성전자" }),
    ).toEqual([{ crno: "A", name: "삼성전자" }]);
  });

  it("빈 조각은 무시한다", () => {
    expect(parseBasket({ basket: "A:삼성전자,,B:SK하이닉스," })).toEqual([
      { crno: "A", name: "삼성전자" },
      { crno: "B", name: "SK하이닉스" },
    ]);
  });

  it("최대 개수를 넘는 나머지는 조용히 잘라낸다", () => {
    const r = parseBasket({ basket: "A:1,B:2,C:3,D:4,E:5,F:6" });
    expect(r).toHaveLength(MAX_BASKET_SIZE);
    expect(r.map((e) => e.crno)).toEqual(["A", "B", "C", "D"]);
  });

  it("배열로 온 값(같은 키 중복)은 첫 값만 쓴다", () => {
    expect(parseBasket({ basket: ["A:1", "B:2"] })).toEqual([
      { crno: "A", name: "1" },
    ]);
  });

  it("이름 없이 법인등록번호만 있으면 빈 이름으로 둔다", () => {
    expect(parseBasket({ basket: "A" })).toEqual([{ crno: "A", name: "" }]);
  });
});

describe("addToBasketHref", () => {
  it("바구니에 새 기업을 추가한 주소를 만든다", () => {
    const href = addToBasketHref({ basket: "A:회사A" }, "B", "회사B");
    const basket = new URLSearchParams(href.replace(/^\?/, "")).get("basket");
    expect(basket).toBe("A:%ED%9A%8C%EC%82%ACA,B:%ED%9A%8C%EC%82%ACB");
  });

  it("이미 담긴 법인등록번호를 다시 담아도 중복되지 않는다", () => {
    const href = addToBasketHref({ basket: "A:회사A" }, "A", "회사A");
    const basket = new URLSearchParams(href.replace(/^\?/, "")).get("basket");
    expect(basket).toBe("A:%ED%9A%8C%EC%82%ACA");
  });

  it("이미 4개 차 있으면 더 담지 않는다", () => {
    const href = addToBasketHref(
      { basket: "A:1,B:2,C:3,D:4" },
      "E",
      "5",
    );
    const basket = new URLSearchParams(href.replace(/^\?/, "")).get("basket");
    expect(basket).toBe("A:1,B:2,C:3,D:4");
  });

  it("검색어 등 다른 쿼리는 그대로 둔다", () => {
    const href = addToBasketHref({ basket: "A:1", q: "삼성" }, "B", "2");
    const q = new URLSearchParams(href.replace(/^\?/, ""));
    expect(q.get("q")).toBe("삼성");
  });
});

describe("removeFromBasketHref", () => {
  it("지정한 법인등록번호만 바구니에서 뺀다", () => {
    const href = removeFromBasketHref({ basket: "A:1,B:2,C:3" }, "B");
    const basket = new URLSearchParams(href.replace(/^\?/, "")).get("basket");
    expect(basket).toBe("A:1,C:3");
  });

  it("마지막 하나를 빼면 basket 쿼리가 빈 문자열이 된다", () => {
    const href = removeFromBasketHref({ basket: "A:1" }, "A");
    expect(new URLSearchParams(href.replace(/^\?/, "")).get("basket")).toBe(
      "",
    );
  });
});
