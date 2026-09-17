import { SearchX } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockCard } from "@/components/screener/stock-card";
import { StockRow } from "@/components/screener/stock-row";
import type { RankedItem } from "@/lib/screen/rules";

export function ResultsTable({ items }: { items: RankedItem[] }) {
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
              <TableHead>종목명</TableHead>
              <TableHead>시장</TableHead>
              <TableHead>시가총액</TableHead>
              <TableHead>EV/EBIT</TableHead>
              <TableHead>ROIC</TableHead>
              <TableHead>FCF Yield</TableHead>
              <TableHead>PER</TableHead>
              <TableHead>PBR</TableHead>
              <TableHead>Altman Z 백분위</TableHead>
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
