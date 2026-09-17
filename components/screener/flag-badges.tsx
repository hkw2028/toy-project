import { Badge } from "@/components/ui/badge";
import { describeFlag } from "@/lib/format";
import type { AnomalyFlag } from "@/lib/metrics/flags";

/**
 * 이상치 경고를 배지로 보여준다. 목록에서 종목을 빼지 않고 표시만 한다.
 *
 * 이 디자인 시스템에는 "주의" 전용 색상 토큰이 없으므로, 화면마다 임의의
 * 색상을 덮어쓰는 대신 이미 있는 destructive 토큰(semantic color)을 그대로
 * 쓴다.
 */
export function FlagBadges({ flags }: { flags: AnomalyFlag[] }) {
  if (flags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((flag) => (
        <Badge key={flag} variant="destructive">
          {describeFlag(flag)}
        </Badge>
      ))}
    </div>
  );
}
