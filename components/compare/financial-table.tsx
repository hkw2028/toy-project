import { XIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  removeFromBasketHref,
  type BasketEntry,
  type RawSearchParams,
} from "@/lib/compare/basket";
import type { YearlyFinancials } from "@/lib/compare/financials";
import { formatRawPercent, formatWon } from "@/lib/format";

type Row = {
  label: string;
  value: (y: YearlyFinancials) => string;
};

const ROWS: Row[] = [
  { label: "매출액", value: (y) => amount(y.sales) },
  { label: "영업이익", value: (y) => amount(y.operatingIncome) },
  { label: "당기순이익", value: (y) => amount(y.netIncome) },
  { label: "총자산", value: (y) => amount(y.totalAssets) },
  { label: "총부채", value: (y) => amount(y.totalLiabilities) },
  { label: "자본총계", value: (y) => amount(y.totalEquity) },
  {
    label: "부채비율",
    value: (y) => (y.debtRatio === null ? "—" : formatRawPercent(y.debtRatio)),
  },
];

function amount(n: number | null): string {
  return n === null ? "—" : formatWon(n);
}

export function FinancialTable({
  company,
  years,
  searchParams,
}: {
  company: BasketEntry;
  years: YearlyFinancials[];
  searchParams: RawSearchParams;
}) {
  return (
    <Card className="w-full shrink-0 md:w-80">
      <CardHeader>
        <CardTitle>{company.name}</CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${company.name} 바구니에서 빼기`}
            nativeButton={false}
            render={
              <Link href={removeFromBasketHref(searchParams, company.crno)} />
            }
          >
            <XIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>항목</TableHead>
                {years.map((y) => (
                  <TableHead key={y.bizYear}>{y.bizYear}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  {years.map((y) => (
                    <TableCell key={y.bizYear}>{row.value(y)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

/** 한 기업의 재무 조회가 실패했을 때 그 칸에 보여줄 카드. */
export function FinancialTableError({
  company,
  reason,
  searchParams,
}: {
  company: BasketEntry;
  reason: string;
  searchParams: RawSearchParams;
}) {
  return (
    <Card className="w-full shrink-0 md:w-80">
      <CardHeader>
        <CardTitle>{company.name}</CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${company.name} 바구니에서 빼기`}
            nativeButton={false}
            render={
              <Link href={removeFromBasketHref(searchParams, company.crno)} />
            }
          >
            <XIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertTitle>재무 정보를 가져오지 못했습니다</AlertTitle>
          <AlertDescription>{reason}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
