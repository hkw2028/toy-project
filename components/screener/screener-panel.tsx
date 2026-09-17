import { FolderSearch } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { RuleForm } from "@/components/screener/rule-form";
import { ResultsTable } from "@/components/screener/results-table";
import { formatBasDt } from "@/lib/format";
import {
  applyRules,
  capResults,
  parseRules,
  summarizeExclusions,
  type RawSearchParams,
} from "@/lib/screen/rules";
import { parseSort, sortItems } from "@/lib/screen/sort";
import { loadLatestSnapshot } from "@/lib/universe/load";

/**
 * 국내 상장종목 스크리너 탭의 내용.
 *
 * 페이지 shell(`<main>`, width, padding)은 상위(`app/page.tsx`)가 관리하고
 * 여기서는 이 탭의 목적에 필요한 내용만 반환한다.
 */
export async function ScreenerPanel({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  const snapshot = await loadLatestSnapshot();

  if (!snapshot) {
    return (
      <Empty className="w-full border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderSearch />
          </EmptyMedia>
          <EmptyTitle>스냅샷이 없습니다</EmptyTitle>
          <EmptyDescription>
            아직 지표 스냅샷을 만들지 않았습니다. 터미널에서{" "}
            <code className="rounded bg-muted px-1 py-0.5">
              bun run universe
            </code>
            를 실행해 만들어 주세요.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const rules = parseRules(searchParams);
  const sort = parseSort(searchParams);
  const { population, matched } = applyRules(snapshot.items, rules);
  const passed = capResults(sortItems(matched, sort), rules.resultCount);
  const exclusions = summarizeExclusions(snapshot.items);
  const excludedTotal = Object.values(exclusions).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        재무 기준 사업연도 {snapshot.bizYear} · 시세 기준일{" "}
        {formatBasDt(snapshot.priceBasDt)} · 상장 목록 기준일{" "}
        {formatBasDt(snapshot.listedBasDt)}
      </p>

      <Alert>
        <AlertTitle>이 화면은 계산 결과이지 투자 자문이 아닙니다</AlertTitle>
        <AlertDescription>
          아래 규칙에 따라 걸러낸 결과를 보여줄 뿐, 특정 종목의 매수를
          권유하거나 비중 배분을 제시하지 않습니다. 순부채 근사, Altman Z
          백분위 등 지표의 한계는 각 항목의 정의를 참고하세요.
        </AlertDescription>
      </Alert>

      <RuleForm rules={rules} />

      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        <p>
          모집단 {population.toLocaleString("ko-KR")}종목 중 규칙을 통과한{" "}
          <span className="font-medium text-foreground">
            {passed.length.toLocaleString("ko-KR")}종목
          </span>
          을 보여줍니다.
        </p>
        <p>
          순위는 전 종목 중 EV/EBIT이 쌀수록 앞서는 순위와 ROIC이 높을수록
          앞서는 순위를 더한 값이 낮은 순입니다. 규칙을 바꿔도 이미 매겨진
          순위와 백분위 자체는 바뀌지 않습니다.
        </p>
        {excludedTotal > 0 && (
          <p>
            순위 대상에서 빠진 {excludedTotal.toLocaleString("ko-KR")}종목:{" "}
            {Object.entries(exclusions)
              .map(([reason, count]) => `${reason} ${count.toLocaleString("ko-KR")}건`)
              .join(", ")}
          </p>
        )}
      </div>

      <ResultsTable items={passed} searchParams={searchParams} />
    </div>
  );
}
