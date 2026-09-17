import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * 기업 검색 폼.
 *
 * 순수 HTML GET 폼이라 자바스크립트 없이도 동작한다. 바구니(`basket`)는
 * 감춰진 입력으로 함께 실어 보내, 검색해도 지금 담긴 기업이 사라지지 않게
 * 한다.
 */
export function SearchForm({
  query,
  basket,
}: {
  query: string;
  basket: string[];
}) {
  return (
    <form method="get" className="flex flex-col gap-4">
      <input type="hidden" name="basket" value={basket.join(",")} />
      <FieldGroup className="flex flex-row items-end gap-2">
        <Field className="flex-1">
          <FieldLabel htmlFor="q">기업 검색</FieldLabel>
          <Input
            id="q"
            name="q"
            type="text"
            placeholder="예: 삼성전자, SK하이닉스"
            defaultValue={query}
          />
        </Field>
        <Button type="submit">검색</Button>
      </FieldGroup>
    </form>
  );
}
