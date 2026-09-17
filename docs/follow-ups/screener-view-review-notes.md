# 스크리너 화면 리뷰 메모 (스타일, 급하지 않음)

- `components/screener/stock-row.tsx`와 `stock-card.tsx`가 토글 버튼과 "금융위 재무/OpenDART 재무제표" 기준 문장을 거의 그대로 중복한다(상세 지표 `dl`은 정렬·툴팁 작업 중 `MetricStat` 공유 컴포넌트로 뽑아 해소했다). 남은 둘도 공통 하위 컴포넌트로 뽑을 수 있다.
- 새로 추가된 shadcn 컴포넌트 10개가 전부 `import { cn } from "cn"`(공식 `shadcn-ui/cn` 패키지)을 쓰는데, 기존 코드(`components/ui/button.tsx`, `app/layout.tsx`)는 `lib/utils.ts`의 자체 `cn()`을 쓴다. 두 구현이 기능은 같지만 갈래가 둘이다. shadcn CLI가 최신 버전부터 이렇게 내보내는 것으로 보여, `@/lib/utils`로 강제 통일하면 이후 `shadcn add`/`update` diff와 계속 어긋날 수 있다.
- 백분위(0~100)·결과 개수(1~200) 범위가 `lib/screen/rules.ts`의 clamp 로직과 `components/screener/rule-form.tsx`의 `input min/max` 양쪽에 숫자로 중복돼 있다. 서버 쪽 clamp가 최종 방어선이라 위험은 낮다.
