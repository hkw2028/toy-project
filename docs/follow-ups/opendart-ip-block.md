# OpenDART가 IP 단위로 요청을 거부해 스냅샷 생성을 끝낼 수 없다

**Symptom**: `bun run universe`로 상장 2,756종목의 재무제표를 받던 중 응답이
끊기기 시작했고, 재무제표 확보율이 30.2%(831/2,756)에 그쳤다. 이후로는 인증키
없이 `https://opendart.fss.or.kr/` 홈페이지를 열어도 연결되지 않는다.

**Observed evidence**: 수집 중 `Connection reset by peer`가 발생했다. HTTP 오류
응답이 아니라 TCP 연결 자체가 끊긴다. `curl -s -o /dev/null -w "%{http_code}"
https://opendart.fss.or.kr/`가 `000`을 돌려준다. 같은 시점에 금융위 API는
`http://apis.data.go.kr/1160100/service/GetFinaStatInfoService_V2/getSummFinaStat_V2`
호출이 `resultCode=00`으로 정상이므로 로컬 네트워크 문제가 아니다. 60초 간격으로
20회 확인했으나 20분 동안 상태가 바뀌지 않았다. 차단이 시작된 시점의 당일 누적
호출량은 약 7,000건으로, 문서에 적힌 일일 한도 20,000건의 3분의 1 수준이다.
표본 120종목을 같은 동시 실행 수(8)로 돌렸을 때는 재현되지 않았다.

**Suspected cause**: OpenDART에 문서화되지 않은 단시간 요청 밀도 제한이 있고,
이를 넘기면 인증키가 아니라 출발지 IP 단위로 차단하는 것으로 보인다. 홈페이지
접근까지 막히는 점이 키 단위가 아니라는 근거다. 해제 조건과 지속 시간은 확인하지
못했다.

**What was tried**: 수집기에 요청 간 최소 간격 150ms를 넣고 동시 실행 수를 8에서
2로 낮췄다. 연결이 끊기면 지수 백오프로 3회까지 다시 시도하고, 연속 10회 실패하면
`DartBlockedError`로 조기에 멈춘다. 받아 둔 재무제표는 `data/statements-<연도>.json`에
남겨 다시 실행할 때 남은 종목부터 이어받는다. 이 조치로 차단을 덜 부르고 재시도
비용을 줄였지만, 이미 걸린 차단을 푸는 것도 아니고 차단이 다시 걸리지 않는다는
보장도 없다. 낮춘 값이 충분한지는 차단이 풀린 뒤에야 확인할 수 있다.

**Proposed next step**: `curl -s -o /dev/null -w "%{http_code}"
https://opendart.fss.or.kr/`로 차단 해제를 확인한 뒤 `bun run universe`를 다시
실행한다. 재무제표 확보율이 95% 이상, 지표 완성 종목이 1,250개 이상인지 보고,
같은 조건에서 다시 차단되면 간격을 늘려 어느 값에서 안정적인지 찾는다. 끝내
재현되면 OpenDART에 실제 제한 값을 문의한다.
