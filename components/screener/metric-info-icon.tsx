import { Info } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { METRIC_INFO, type MetricKey } from "@/lib/screen/metric-info";

/** 지표 이름 옆에 붙이는 설명 아이콘. 표 헤더와 펼침 상세 라벨 양쪽에서 쓴다. */
export function MetricInfoIcon({ metric }: { metric: MetricKey }) {
  const info = METRIC_INFO[metric];

  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={`${info.label} 설명`}
        className="inline-flex align-middle text-muted-foreground hover:text-foreground"
      >
        <Info className="size-3" />
      </TooltipTrigger>
      <TooltipContent>{info.description}</TooltipContent>
    </Tooltip>
  );
}
