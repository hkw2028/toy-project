import { Skeleton } from "@/components/ui/skeleton";

/**
 * 스냅샷을 읽고 규칙을 적용하는 동안 보여줄 로딩 상태.
 *
 * `searchParams`를 읽는 페이지는 매 요청마다 동적으로 렌더링되므로, 이 파일이
 * 그 사이 스트리밍되는 순간의 자리표시자가 된다.
 */
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-40 w-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-96 w-full" />
    </main>
  );
}
