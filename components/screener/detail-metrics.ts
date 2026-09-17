import { formatMultiple, formatPercent } from "@/lib/format";
import type { RankedItem } from "@/lib/screen/rules";

export type DetailMetric = { label: string; value: string };

/**
 * 종목을 펼쳤을 때 보이는 지표 목록.
 *
 * 결과 표(닫힌 상태)에 이미 나오는 지표(EV/EBIT, ROIC, FCF Yield, PER, PBR,
 * Altman Z 백분위)는 여기 다시 넣지 않는다.
 */
export function detailMetrics(item: RankedItem): DetailMetric[] {
  return [
    { label: "발생액 비율", value: formatPercent(item.accrualRatio) },
    { label: "이익의 질", value: formatMultiple(item.earningsQuality) },
    { label: "NCAV 배수", value: formatMultiple(item.ncavMultiple) },
    { label: "순이익률 (DuPont)", value: formatPercent(item.netMargin) },
    { label: "자산회전율 (DuPont)", value: formatMultiple(item.assetTurnover) },
    { label: "재무레버리지 (DuPont)", value: formatMultiple(item.leverage) },
    { label: "실효법인세율", value: formatPercent(item.effectiveTaxRate) },
  ];
}
