import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { QUERY_KEY, type ScreenRules } from "@/lib/screen/rules";

/**
 * 규칙 편집 폼.
 *
 * 순수 HTML GET 폼이라 자바스크립트 없이도 동작한다. 제출하면 같은 경로를
 * 새 쿼리 문자열로 다시 요청하므로, 그 URL 자체가 지금 적용된 규칙이자
 * 공유 가능한 링크가 된다.
 */
export function RuleForm({ rules }: { rules: ScreenRules }) {
  return (
    <form method="get" className="flex flex-col gap-6">
      <FieldSet>
        <FieldLegend variant="label">규칙</FieldLegend>
        <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <PercentileField
            name={QUERY_KEY.evEbitMaxPercentile}
            label="EV/EBIT 백분위 상한"
            description="낮을수록 저평가. 이 값 이하만 통과"
            defaultValue={rules.evEbitMaxPercentile}
          />
          <PercentileField
            name={QUERY_KEY.roicMinPercentile}
            label="ROIC 백분위 하한"
            description="높을수록 자본 효율이 좋음"
            defaultValue={rules.roicMinPercentile}
          />
          <PercentileField
            name={QUERY_KEY.fcfYieldMinPercentile}
            label="FCF Yield 백분위 하한"
            description="실제로 남는 현금이 많을수록 높음"
            defaultValue={rules.fcfYieldMinPercentile}
          />
          <PercentileField
            name={QUERY_KEY.altmanZMinPercentile}
            label="Altman Z 백분위 하한"
            description="모집단 안에서의 상대 순위. 절대 기준으로 읽지 않음"
            defaultValue={rules.altmanZMinPercentile}
          />
          <Field>
            <FieldLabel htmlFor={QUERY_KEY.resultCount}>결과 개수</FieldLabel>
            <Input
              id={QUERY_KEY.resultCount}
              name={QUERY_KEY.resultCount}
              type="number"
              min={1}
              max={200}
              defaultValue={rules.resultCount}
            />
            <FieldDescription>1~200</FieldDescription>
          </Field>
        </FieldGroup>
      </FieldSet>
      <div>
        <Button type="submit">규칙 적용</Button>
      </div>
    </form>
  );
}

function PercentileField({
  name,
  label,
  description,
  defaultValue,
}: {
  name: string;
  label: string;
  description: string;
  defaultValue: number;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        id={name}
        name={name}
        type="number"
        min={0}
        max={100}
        defaultValue={defaultValue}
      />
      <FieldDescription>{description}</FieldDescription>
    </Field>
  );
}
