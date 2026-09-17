import { SearchX } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableHeader } from "@/components/screener/sortable-header";
import { StockCard } from "@/components/screener/stock-card";
import { StockRow } from "@/components/screener/stock-row";
import type { RawSearchParams, RankedItem } from "@/lib/screen/rules";

export function ResultsTable({
  items,
  searchParams,
}: {
  items: RankedItem[];
  searchParams: RawSearchParams;
}) {
  if (items.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>통과한 종목이 없습니다</EmptyTitle>
          <EmptyDescription>
            규칙을 완화하면 통과 종목이 늘어납니다. 위에서 백분위 조건을
            조정해 보세요.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <SortableHeader label="종목명" sortKey="name" searchParams={searchParams} />
              <SortableHeader label="시장" sortKey="market" searchParams={searchParams} />
              <SortableHeader
                label="시가총액"
                sortKey="marketCap"
                searchParams={searchParams}
              />
              <SortableHeader
                label="EV/EBIT"
                sortKey="evToEbit"
                metric="evToEbit"
                searchParams={searchParams}
              />
              <SortableHeader
                label="ROIC"
                sortKey="roic"
                metric="roic"
                searchParams={searchParams}
              />
              <SortableHeader
                label="FCF Yield"
                sortKey="fcfYield"
                metric="fcfYield"
                searchParams={searchParams}
              />
              <SortableHeader
                label="PER"
                sortKey="per"
                metric="per"
                searchParams={searchParams}
              />
              <SortableHeader
                label="PBR"
                sortKey="pbr"
                metric="pbr"
                searchParams={searchParams}
              />
              <SortableHeader
                label="Altman Z 백분위"
                sortKey="altmanZ"
                metric="altmanZ"
                searchParams={searchParams}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <StockRow key={item.stockCode} item={item} />
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-4 md:hidden">
        {items.map((item) => (
          <StockCard key={item.stockCode} item={item} />
        ))}
      </div>
    </>
  );
}
