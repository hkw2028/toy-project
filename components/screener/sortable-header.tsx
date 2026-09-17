import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";

import { TableHead } from "@/components/ui/table";
import { MetricInfoIcon } from "@/components/screener/metric-info-icon";
import type { RawSearchParams } from "@/lib/screen/rules";
import type { MetricKey } from "@/lib/screen/metric-info";
import { parseSort, sortHref, type SortKey } from "@/lib/screen/sort";

/**
 * 클릭하면 정렬 기준이 바뀌는 표 헤더.
 *
 * 순수 링크라 자바스크립트 없이도 동작하고, 다른 쿼리(규칙 등)는 그대로 둔
 * 채 정렬 값만 바꾼다. `metric`을 주면 설명 아이콘도 함께 붙는다.
 */
export function SortableHeader({
  label,
  sortKey,
  metric,
  searchParams,
}: {
  label: string;
  sortKey: SortKey;
  metric?: MetricKey;
  searchParams: RawSearchParams;
}) {
  const current = parseSort(searchParams);
  const active = current.key === sortKey;

  return (
    <TableHead>
      <span className="inline-flex items-center gap-1">
        <Link
          href={sortHref(searchParams, sortKey)}
          className="inline-flex items-center gap-1 hover:underline"
        >
          {label}
          {active &&
            (current.direction === "asc" ? (
              <ArrowUp className="size-3" />
            ) : (
              <ArrowDown className="size-3" />
            ))}
        </Link>
        {metric && <MetricInfoIcon metric={metric} />}
      </span>
    </TableHead>
  );
}
