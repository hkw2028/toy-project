import Link from "next/link";
import { MagnifyingGlassMinusIcon } from "@phosphor-icons/react/ssr";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  addToBasketHref,
  MAX_BASKET_SIZE,
  type BasketEntry,
  type RawSearchParams,
} from "@/lib/compare/basket";
import type { CompanyHit } from "@/lib/compare/search";

export function SearchResults({
  hits,
  hasMore,
  basket,
  searchParams,
}: {
  hits: CompanyHit[];
  hasMore: boolean;
  basket: BasketEntry[];
  searchParams: RawSearchParams;
}) {
  if (hits.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MagnifyingGlassMinusIcon />
          </EmptyMedia>
          <EmptyTitle>검색 결과가 없습니다</EmptyTitle>
          <EmptyDescription>다른 검색어로 다시 시도해 보세요.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const full = basket.length >= MAX_BASKET_SIZE;

  return (
    <div className="flex flex-col gap-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>법인명</TableHead>
            <TableHead>종목명</TableHead>
            <TableHead>시장</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {hits.map((hit) => {
            const already = basket.some((e) => e.crno === hit.crno);
            return (
              <TableRow key={hit.crno}>
                <TableCell className="font-medium">{hit.corpNm}</TableCell>
                <TableCell>{hit.itmsNm}</TableCell>
                <TableCell>{hit.market}</TableCell>
                <TableCell>
                  {already ? (
                    <span className="text-sm text-muted-foreground">담김</span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={full}
                      nativeButton={false}
                      render={
                        <Link
                          href={addToBasketHref(
                            searchParams,
                            hit.crno,
                            hit.corpNm,
                          )}
                        />
                      }
                    >
                      담기
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {full && (
        <p className="text-sm text-muted-foreground">
          바구니가 {MAX_BASKET_SIZE}개로 가득 찼습니다. 더 담으려면 먼저
          빼주세요.
        </p>
      )}
      {hasMore && (
        <p className="text-sm text-muted-foreground">
          결과가 더 있습니다. 검색어를 더 좁혀 보세요.
        </p>
      )}
    </div>
  );
}
