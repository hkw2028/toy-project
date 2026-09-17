import Link from "next/link";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScreenerPanel } from "@/components/screener/screener-panel";
import { ComparePanel } from "@/components/compare/compare-panel";
import type { RawSearchParams } from "@/lib/screen/rules";

const TAB_QUERY_KEY = "tab";
const TABS = ["screener", "compare"] as const;
type TabValue = (typeof TABS)[number];

/**
 * `tab`이 없어도, 기업 비교 전용 쿼리(`q`, `basket`)가 있으면 그 탭을 연
 * 것으로 본다. 탭이 생기기 전의 링크나 비교 파라미터만 든 URL도 올바른
 * 화면으로 재현돼야 하기 때문이다(스크리너는 이 두 쿼리 키를 쓰지 않는다).
 */
function parseTab(searchParams: RawSearchParams): TabValue {
  const raw = searchParams[TAB_QUERY_KEY];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (TABS.includes(value as TabValue)) return value as TabValue;

  if (searchParams.q !== undefined || searchParams.basket !== undefined) {
    return "compare";
  }
  return "screener";
}

/** 탭 전환 링크. 다른 쿼리(규칙, 검색어, 바구니 등)는 그대로 들고 넘어간다. */
function tabHref(searchParams: RawSearchParams, tab: TabValue): string {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(searchParams)) {
    if (name === TAB_QUERY_KEY) continue;
    for (const v of Array.isArray(value) ? value : [value]) {
      if (v !== undefined) query.append(name, v);
    }
  }
  query.set(TAB_QUERY_KEY, tab);
  return `?${query.toString()}`;
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const rawSearchParams = await searchParams;
  const tab = parseTab(rawSearchParams);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          국내 상장종목 스크리너
        </h1>
      </header>

      {/* 실제 전환은 Link 이동으로 일어나 매번 새 tab 값이 서버에서 내려오므로, defaultValue가 아니라 value로 완전히 제어한다. */}
      <Tabs value={tab}>
        <TabsList>
          <TabsTrigger
            value="screener"
            nativeButton={false}
            render={<Link href={tabHref(rawSearchParams, "screener")} />}
          >
            스크리너
          </TabsTrigger>
          <TabsTrigger
            value="compare"
            nativeButton={false}
            render={<Link href={tabHref(rawSearchParams, "compare")} />}
          >
            기업 비교
          </TabsTrigger>
        </TabsList>

        <TabsContent value="screener">
          {tab === "screener" && (
            <ScreenerPanel searchParams={rawSearchParams} />
          )}
        </TabsContent>
        <TabsContent value="compare">
          {tab === "compare" && (
            <ComparePanel searchParams={rawSearchParams} />
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
