"use client";

import { useState } from "react";
import { CaretDownIcon, CaretRightIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { detailMetrics } from "@/components/screener/detail-metrics";
import { FlagBadges } from "@/components/screener/flag-badges";
import { MetricStat } from "@/components/screener/metric-stat";
import {
  formatDartBasis,
  formatFscBasis,
  formatMultiple,
  formatPercent,
  formatPercentile,
  formatWon,
} from "@/lib/format";
import type { RankedItem } from "@/lib/screen/rules";

/**
 * 좁은 화면용 종목 카드. 표와 같은 정보를 같은 순서로 담되, 가로 스크롤 없이
 * 세로로 쌓는다.
 */
export function StockCard({ item }: { item: RankedItem }) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="stock-name">
          {item.rank}위 · {item.name}
        </CardTitle>
        <CardDescription>
          {item.market} · 시가총액 {formatWon(item.marketCap)}
        </CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-expanded={open}
            aria-label={`${item.name} 상세 지표 ${open ? "닫기" : "펼치기"}`}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CaretDownIcon /> : <CaretRightIcon />}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <MetricStat metric="evToEbit" value={formatMultiple(item.evToEbit)} />
          <MetricStat metric="roic" value={formatPercent(item.roic)} />
          <MetricStat metric="fcfYield" value={formatPercent(item.fcfYield)} />
          <MetricStat metric="per" value={formatMultiple(item.per)} />
          <MetricStat metric="pbr" value={formatMultiple(item.pbr)} />
          <MetricStat
            metric="altmanZ"
            value={formatPercentile(item.percentile.altmanZ)}
          />
        </dl>

        <FlagBadges flags={item.flags} />

        {open && (
          <>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-3 text-sm">
              {detailMetrics(item).map((m) => (
                <MetricStat key={m.metric} metric={m.metric} value={m.value} />
              ))}
            </dl>
            <p className="text-xs text-muted-foreground">
              금융위 재무: {formatFscBasis(item.basis.fsc)} · OpenDART
              재무제표: {formatDartBasis(item.basis.dart)}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
