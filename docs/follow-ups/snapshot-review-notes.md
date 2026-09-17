# 지표 스냅샷 생성기 리뷰 메모 (급하지 않음)

- `lib/universe/build.ts`의 `num()`이 `lib/dart/response.ts`의 `toAmount()`와 구현이 동일하다. 공유 유틸로 추출할 것.
- 금융위 재무상태표 계정(유동자산/유동부채/이익잉여금)이 리터럴 문자열로 조회된다. DART처럼 상수맵으로 옮기면 일관된다.
- `toSnapshotItem`(`lib/universe/build.ts`)이 원천 추출·11개 지표 호출·조립을 모두 담당해 지표가 늘 때마다 함수가 계속 커진다.
- `earnings-swing` 플래그(`lib/metrics/flags.ts`)가 스펙의 "3배 넘게 변동" 조건 외에 흑자↔적자 부호 전환도 배수와 무관하게 플래그한다. 의도적으로 보이지만 스펙에 없는 조건이라 명문화가 필요하다.
