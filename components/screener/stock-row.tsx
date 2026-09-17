"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { detailMetrics } from "@/components/screener/detail-metrics";
import { FlagBadges } from "@/components/screener/flag-badges";
import {
  formatDartBasis,
  formatFscBasis,
  formatMultiple,
  formatPercent,
  formatPercentile,
  formatWon,
} from "@/lib/format";
import type { RankedItem } from "@/lib/screen/rules";

// 토글용 빈 칸 하나를 제외한 나머지 아홉 개 열(종목명~Altman Z 백분위)을
// 이 값으로 합쳐 펼침·경고 줄이 표 끝까지 닿게 한다. 헤더 열이 늘면 같이
// 늘려야 한다.
const DETAIL_COLUMN_COUNT = 9;

/** 결과 표의 종목 한 줄. 펼치면 바로 아래 줄에 상세 지표가 나온다. */
export function StockRow({ item }: { item: RankedItem }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-expanded={open}
            aria-label={`${item.name} 상세 지표 ${open ? "닫기" : "펼치기"}`}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <ChevronDown /> : <ChevronRight />}
          </Button>
        </TableCell>
        <TableCell className="font-medium" data-testid="stock-name">
          {item.name}
        </TableCell>
        <TableCell>{item.market}</TableCell>
        <TableCell>{formatWon(item.marketCap)}</TableCell>
        <TableCell>{formatMultiple(item.evToEbit)}</TableCell>
        <TableCell>{formatPercent(item.roic)}</TableCell>
        <TableCell>{formatPercent(item.fcfYield)}</TableCell>
        <TableCell>{formatMultiple(item.per)}</TableCell>
        <TableCell>{formatMultiple(item.pbr)}</TableCell>
        <TableCell>{formatPercentile(item.percentile.altmanZ)}</TableCell>
      </TableRow>
      {item.flags.length > 0 && (
        <TableRow>
          <TableCell />
          <TableCell colSpan={DETAIL_COLUMN_COUNT}>
            <FlagBadges flags={item.flags} />
          </TableCell>
        </TableRow>
      )}
      {open && (
        <TableRow>
          <TableCell />
          <TableCell colSpan={DETAIL_COLUMN_COUNT}>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 py-2 sm:grid-cols-4">
              {detailMetrics(item).map((m) => (
                <div key={m.label}>
                  <dt className="text-xs text-muted-foreground">{m.label}</dt>
                  <dd>{m.value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-muted-foreground">
              금융위 재무: {formatFscBasis(item.basis.fsc)} · OpenDART 재무제표:{" "}
              {formatDartBasis(item.basis.dart)}
            </p>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
