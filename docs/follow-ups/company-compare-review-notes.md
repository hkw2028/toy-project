# 기업 검색·비교 리뷰 메모 (스타일, 급하지 않음)

- `components/compare/financial-table.tsx`의 `FinancialTable`과 `FinancialTableError`가 `CardHeader`(제목 + 바구니에서 빼기 버튼) 블록을 그대로 중복한다. 공통 헤더 하위 컴포넌트로 뽑을 수 있다.
- `lib/format.ts`의 `formatRawPercent`(원천이 이미 %로 주는 값)와 기존 `formatPercent`(0~1 비율을 ×100)가 이름만으로는 구분이 잘 안 된다. 호출부를 헷갈리기 쉬우니 이름을 더 명확히 하거나 JSDoc 이상의 표시가 있으면 좋다.
- 실패 표현이 모듈마다 다르다: `lib/compare/search.ts`·`financials.ts`는 `T | { error: string }`, `app/compare/page.tsx`의 `resolveCompany`는 `{ ok, reason }`, 기존 `lib/fsc/client.ts`의 `fetchFsc`는 `{ ok, code, reason }`. 실제 버그는 아니지만 관례를 하나로 맞추면 읽기 편하다.
- `components/compare/financial-table.tsx`의 카드 내부 표에 `overflow-x-auto`가 있어, 연도가 많은 기업은 좁은 화면에서 카드 안 표가 가로 스크롤된다. spec.md의 "가로 스크롤 없이 세로로 쌓이고"는 여러 기업 카드 자체가 세로로 쌓이는 것으로 읽었고(실제로 그렇게 동작함), 11년치를 한 화면 너비에 다 넣을 방법이 없어 셀 내부 스크롤은 의도된 절충으로 판단했다. 해석이 갈릴 수 있으니 UX 확인이 필요하면 여기부터 본다.
