import { FileSearch } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { SearchForm } from "@/components/compare/search-form";
import { SearchResults } from "@/components/compare/search-results";
import {
  FinancialTable,
  FinancialTableError,
} from "@/components/compare/financial-table";
import { parseBasket, type BasketEntry, type RawSearchParams } from "@/lib/compare/basket";
import { fetchCompanyFinancials, type YearlyFinancials } from "@/lib/compare/financials";
import { parseSearchQuery, searchCompanies } from "@/lib/compare/search";
import { FscKeyMissingError, readFscKey } from "@/lib/fsc/client";

type CompanyResult =
  | { entry: BasketEntry; ok: true; years: YearlyFinancials[] }
  | { entry: BasketEntry; ok: false; reason: string };

/**
 * 기업 검색·비교 탭의 내용.
 *
 * 페이지 shell(`<main>`, width, padding)은 상위(`app/page.tsx`)가 관리하고
 * 여기서는 이 탭의 목적에 필요한 내용만 반환한다.
 */
export async function ComparePanel({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  let key: string;
  try {
    key = readFscKey();
  } catch (e) {
    if (e instanceof FscKeyMissingError) {
      return (
        <Empty className="w-full border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileSearch />
            </EmptyMedia>
            <EmptyTitle>인증키가 없습니다</EmptyTitle>
            <EmptyDescription>{e.message}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }
    throw e;
  }

  const query = parseSearchQuery(searchParams);
  const basket = parseBasket(searchParams);

  const [searchResult, companyResults] = await Promise.all([
    query ? searchCompanies(query, key) : null,
    Promise.all(basket.map((entry) => resolveCompany(entry, key))),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        기업을 검색해 최대 4개까지 담으면 매출·영업이익·순이익·자산·부채·
        자본·부채비율을 연도별로 나란히 비교합니다.
      </p>

      <SearchForm query={query} basket={basket.map((e) => e.crno)} />

      {searchResult &&
        (("error" in searchResult) ? (
          <Alert variant="destructive">
            <AlertTitle>검색에 실패했습니다</AlertTitle>
            <AlertDescription>{searchResult.error}</AlertDescription>
          </Alert>
        ) : (
          <SearchResults
            hits={searchResult.hits}
            hasMore={searchResult.hasMore}
            basket={basket}
            searchParams={searchParams}
          />
        ))}

      {companyResults.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileSearch />
            </EmptyMedia>
            <EmptyTitle>바구니가 비어 있습니다</EmptyTitle>
            <EmptyDescription>
              위에서 기업을 검색해 담아 보세요.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4 md:flex-row md:overflow-x-auto">
          {companyResults.map((r) =>
            r.ok ? (
              <FinancialTable
                key={r.entry.crno}
                company={r.entry}
                years={r.years}
                searchParams={searchParams}
              />
            ) : (
              <FinancialTableError
                key={r.entry.crno}
                company={r.entry}
                reason={r.reason}
                searchParams={searchParams}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

async function resolveCompany(
  entry: BasketEntry,
  key: string,
): Promise<CompanyResult> {
  const r = await fetchCompanyFinancials(entry.crno, key);
  if ("error" in r) return { entry, ok: false, reason: r.error };
  return { entry, ok: true, years: r };
}
