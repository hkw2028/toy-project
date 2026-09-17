# 02 — 스크리너 화면

## Outcome

사용자가 규칙을 정하면 그 규칙이 걸러낸 종목이 순위와 함께 표로 보인다. 지금 무엇을 보고 있는지가 문장으로 되읽히고, 각 종목의 지표 값과 이상치 경고가 함께 보인다. 정한 규칙은 URL에 담겨 그대로 공유된다.

## Blockers

01 — 지표 스냅샷 생성. 스냅샷이 없으면 화면에 보여줄 데이터가 없다.

## Acceptance criteria

- [x] 결과 표에 종목명, 시장, 시가총액, EV/EBIT, ROIC, FCF Yield, PER, PBR, Altman Z 백분위가 보인다
- [x] 종목 하나를 펼치면 발생액 비율, 이익의 질, NCAV 배수, DuPont 3분해(순이익률·자산회전율·재무레버리지), 실효법인세율이 보인다
- [x] 규칙 편집으로 EV/EBIT 백분위 상한, ROIC 백분위 하한, FCF Yield 백분위 하한, Altman Z 백분위 하한, 결과 개수를 정할 수 있다
- [x] 순위 계산 방식이 화면에 설명된다
- [x] 규칙을 바꾸면 결과 목록과 종목 수가 바뀌고 URL이 따라 바뀐다
- [x] 규칙을 바꿔도 각 종목의 순위와 백분위는 달라지지 않는다
- [x] 바뀐 URL을 새 창에서 열면 같은 결과가 재현된다
- [x] 규칙 요약 문장에 모집단 수와 통과 종목 수가 함께 나온다
- [x] 적자로 순위에서 빠진 종목의 사유를 확인할 수 있다
- [x] 이상치로 표시된 종목에 경고가 붙되 목록에서 빠지지 않는다
- [x] 재무 기준 사업연도와 시세 기준일이 화면에 보인다
- [x] 종목마다 금융위 재무와 OpenDART 재무제표가 각각 어느 기준인지 확인할 수 있다
- [x] 면책 문구가 결과 표와 같은 화면에 항상 보인다
- [x] 좁은 화면에서 표가 종목별로 쌓이고 지표 값이 잘리지 않는다
- [x] 로딩, 통과 종목이 0개인 결과, 스냅샷 파일이 없는 상태를 각각 구분해 보여준다

## Constraints

[ui-composition](../../../decisions/ui-composition.md)이 컴포넌트 선택, 시각 토큰, 페이지 구성, 상태 표현, 반응형 동작을 지배한다.

화면은 종목 매수를 권유하는 문구를 쓰지 않고 비중 배분을 제시하지 않는다. 적용된 규칙이 항상 드러나 있어야 한다.

## Verification

- 규칙을 바꿔 결과 목록과 통과 종목 수가 바뀌는지, 그때 URL이 함께 바뀌는지 브라우저에서 확인한다
- 바뀐 URL을 새 창에서 열어 같은 목록과 같은 종목 수가 나오는지 확인한다
- 통과 종목이 0개가 되는 규칙을 넣어 빈 결과 상태가 로딩이나 스냅샷 부재와 구분되어 보이는지 확인한다
- 좁은 화면 폭에서 표가 쌓이고 지표 값이 잘리지 않는지 확인한다

## Review checkpoint

None.

## Status

<!-- Current values: `pending`, `in-progress`, `completed`, `blocked`, or
`superseded`. -->
completed

## Execution

- Verification: `bun run typecheck`, `bun run lint`, `bun run test`(단위 87개) 모두 통과한다. Playwright E2E 6개(`e2e/screener.spec.ts` 5개, `e2e/smoke.spec.ts` 1개)가 실제 스냅샷 데이터로 통과한다: 규칙 변경 시 URL과 결과가 함께 바뀌고 그 URL을 새 브라우저 컨텍스트에서 열어도 같은 결과가 재현됨, 아무도 통과 못 하는 규칙에서 빈 결과 상태가 보임, 375px 폭에서는 표가 숨고 카드가 보임, 1280px 폭에서는 표가 보임, 종목 상세를 펼치고 접을 수 있음.

  브라우저로 직접 열어 다음도 눈으로 확인했다. 결과 표 아홉 개 열(종목명·시장·시가총액·EV/EBIT·ROIC·FCF Yield·PER·PBR·Altman Z 백분위)이 실제 데이터로 채워짐. 행을 펼치면 발생액 비율·이익의 질·NCAV 배수·DuPont 3분해·실효법인세율과 "금융위 재무: 연결 · OpenDART 재무제표: 연결" 기준 표기가 보임. z(Altman Z 백분위 하한)를 90으로 올렸을 때 실제로 다른 종목 집합(아이디피·이크레더블·트루엔…)이 나오는 것을 스냅샷 원본을 파이썬으로 독립 계산한 결과와 대조해 정확히 일치함을 확인함. 이때도 순위 표시(예: "36위")는 필터 적용 전 순위 그대로였다(재부여되지 않음). 스냅샷 파일을 임시로 옮겨 "스냅샷이 없습니다" 상태가 빈 결과·로딩과 구분되어 보이는 것도 확인함. 375px 폭에서 규칙 폼과 결과 카드 모두 한 줄씩 쌓이고 잘리는 지표가 없음을 확인함.

  code-review는 돌리지 않았다. AGENTS.md의 검토 예산("자동 코드 리뷰는 최대 1회")을 이번 스펙 작업 중 태스크 01에서 이미 소진했고, 이 태스크 자체도 Review checkpoint를 None으로 선언해 두었다.
- Blocker: 없음.
- Revision: 계획에 없던 작은 보정 두 가지를 했다. (1) 이 세션 시작 시점부터 떠 있던(내가 띄우지 않은) `next dev` 프로세스가 포트 3001을 쓰고 있어 Playwright의 기본 포트(3000) 가정과 충돌했다. `playwright.config.ts`를 포트에 맞춰 고치는 대신, 남은 프로세스를 정리하고 설정은 원래대로 뒀다(설정 파일이 이 세션의 우연한 프로세스 배치에 종속되지 않도록). (2) 이 환경에 설치된 Chromium 리비전(1243)이 프로젝트가 기대하는 리비전(1234)과 달라 `PLAYWRIGHT_CHROMIUM_PATH`로 실행 파일을 직접 지정해 돌렸다. 둘 다 README가 이미 문서화한 대응 방식이다.

  완료 후 사용자 요청으로 `37ef2c6..HEAD`(태스크 01+02 전체) 범위를 `code-review low`로 Standards·Spec 두 축을 다시 검토했다. Spec 축이 실제 결함 하나를 찾았다: `app/page.tsx`의 순위 설명 문구가 "EV/EBIT 백분위와 ROIC 백분위를 더한 값"이라고 썼는데, 실제 계산(`lib/metrics/ranking.ts`의 `combinedRank`)은 원값의 오름차순/내림차순 **순위**(등수)를 더하는 것이지 백분위를 더하는 게 아니었다. spec.md의 문구("EV/EBIT 오름차순 순위와 ROIC 내림차순 순위")와도 어긋났던 설명을 실제 계산에 맞게 고쳤다. Standards 축은 표준 위반 두 건을 찾았다: `flag-badges.tsx`가 `text-amber-700` 같은 raw Tailwind 색상을 써 ui-composition.md의 semantic token 원칙을 어겼기에 기존 `destructive` variant로 바꿨고, `stock-row.tsx`의 상세/경고 행 `colSpan` 상수가 8로 하드코딩돼 헤더 10칸보다 한 칸 모자라 표 끝까지 닿지 않던 것을 9로 고쳤다(브라우저에서 colspan+빈칸=헤더 칸 수, 셀 폭이 표 폭의 93.6%임을 실측 확인). `lib/format.ts`의 `describeFlag`/`formatFscBasis`/`formatDartBasis`도 원시 `string` 대신 기존 도메인 타입(`AnomalyFlag`, `StatementBasis`, `FinancialStatementBasis`)을 쓰도록 좁혀 오타를 컴파일 타임에 잡게 했다. 나머지 지적(두 컴포넌트 간 마크업 중복, `cn()` 구현이 두 갈래인 것, 규칙 범위 숫자의 이중 관리)은 수용 기준을 깨지 않아 `docs/follow-ups/screener-view-review-notes.md`에 한 줄로만 남겼다. 고친 뒤 `typecheck`/`lint`/단위 테스트 87개/E2E 6개를 모두 다시 통과시켰다.
