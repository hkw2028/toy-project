import { formatMultiple, formatPercent } from "@/lib/format";
import { METRIC_INFO, type MetricKey } from "@/lib/screen/metric-info";
import type { RankedItem } from "@/lib/screen/rules";

export type DetailMetric = { metric: MetricKey; label: string; value: string };

/**
 * 종목을 펼쳤을 때 보이는 지표 목록.
 *
 * 결과 표(닫힌 상태)에 이미 나오는 지표(EV/EBIT, ROIC, FCF Yield, PER, PBR,
 * Altman Z 백분위)는 여기 다시 넣지 않는다. 라벨은 `METRIC_INFO`에서 그대로
 * 가져와, 툴팁 설명과 표시 문구가 어긋나지 않게 한다.
 */
export function detailMetrics(item: RankedItem): DetailMetric[] {
  const metric = (key: MetricKey, value: string): DetailMetric => ({
    metric: key,
    label: METRIC_INFO[key].label,
    value,
  });

  return [
    metric("accrualRatio", formatPercent(item.accrualRatio)),
    metric("earningsQuality", formatMultiple(item.earningsQuality)),
    metric("ncavMultiple", formatMultiple(item.ncavMultiple)),
    metric("netMargin", formatPercent(item.netMargin)),
    metric("assetTurnover", formatMultiple(item.assetTurnover)),
    metric("leverage", formatMultiple(item.leverage)),
    metric("effectiveTaxRate", formatPercent(item.effectiveTaxRate)),
  ];
}
