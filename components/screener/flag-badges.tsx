import { Badge } from "@/components/ui/badge";
import { describeFlag } from "@/lib/format";

/** 이상치 경고를 배지로 보여준다. 목록에서 종목을 빼지 않고 표시만 한다. */
export function FlagBadges({ flags }: { flags: string[] }) {
  if (flags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((flag) => (
        <Badge key={flag} variant="outline" className="text-amber-700 dark:text-amber-500">
          {describeFlag(flag)}
        </Badge>
      ))}
    </div>
  );
}
