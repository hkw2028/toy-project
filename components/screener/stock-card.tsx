"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

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
            {open ? <ChevronDown /> : <ChevronRight />}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">EV/EBIT</dt>
            <dd>{formatMultiple(item.evToEbit)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">ROIC</dt>
            <dd>{formatPercent(item.roic)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">FCF Yield</dt>
            <dd>{formatPercent(item.fcfYield)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">PER</dt>
            <dd>{formatMultiple(item.per)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">PBR</dt>
            <dd>{formatMultiple(item.pbr)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Altman Z 백분위</dt>
            <dd>{formatPercentile(item.percentile.altmanZ)}</dd>
          </div>
        </dl>

        <FlagBadges flags={item.flags} />

        {open && (
          <>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-3 text-sm">
              {detailMetrics(item).map((m) => (
                <div key={m.label}>
                  <dt className="text-xs text-muted-foreground">{m.label}</dt>
                  <dd>{m.value}</dd>
                </div>
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
