import { MetricInfoIcon } from "@/components/screener/metric-info-icon";
import { METRIC_INFO, type MetricKey } from "@/lib/screen/metric-info";

/**
 * 지표 하나를 라벨+설명 아이콘+값으로 보여주는 한 칸.
 *
 * 카드 본문과 펼침 상세 양쪽에서 같은 모양으로 쓴다.
 */
export function MetricStat({
  metric,
  value,
}: {
  metric: MetricKey;
  value: string;
}) {
  return (
    <div>
      <dt className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        {METRIC_INFO[metric].label}
        <MetricInfoIcon metric={metric} />
      </dt>
      <dd>{value}</dd>
    </div>
  );
}
