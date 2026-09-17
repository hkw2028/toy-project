/**
 * 지표 설명. 툴팁에 그대로 쓴다.
 *
 * 새로 지어낸 설명이 아니라 spec.md "확정된 제약과 근거"와 `lib/metrics/*`의
 * 계산 근거를 그대로 옮긴 것이다. 한 곳에서 관리해 표 헤더와 펼침 상세
 * 라벨 양쪽에서 같은 문구를 쓴다.
 */
export type MetricKey =
  | "evToEbit"
  | "roic"
  | "fcfYield"
  | "per"
  | "pbr"
  | "altmanZ"
  | "accrualRatio"
  | "earningsQuality"
  | "ncavMultiple"
  | "netMargin"
  | "assetTurnover"
  | "leverage"
  | "effectiveTaxRate";

export const METRIC_INFO: Record<MetricKey, { label: string; description: string }> = {
  evToEbit: {
    label: "EV/EBIT",
    description:
      "시가총액에 부채총계를 더하고 현금및현금성자산을 뺀 값(순부채 근사)을 영업이익으로 나눈 값입니다. 낮을수록 저평가로 봅니다.",
  },
  roic: {
    label: "ROIC",
    description:
      "세후영업이익을 투하자본(총자산−유동부채로 근사)으로 나눈 값입니다. 높을수록 자본을 효율적으로 씁니다.",
  },
  fcfYield: {
    label: "FCF Yield",
    description:
      "영업활동현금흐름에서 유형자산 취득액을 뺀 잉여현금흐름을 시가총액으로 나눈 값입니다. 실제로 남는 현금이 많을수록 높습니다.",
  },
  per: {
    label: "PER",
    description: "시가총액을 당기순이익으로 나눈 값입니다. 적자 기업은 정의되지 않아 순위에서 빠집니다.",
  },
  pbr: {
    label: "PBR",
    description:
      "시가총액을 지배기업 소유주지분으로 나눈 값입니다. 자본총계가 아니라 지배주주 몫만 분모로 씁니다.",
  },
  altmanZ: {
    label: "Altman Z 백분위",
    description:
      "부도 위험을 가늠하는 Altman Z-Score의, 이 모집단 안에서의 상대 순위입니다. 미국 제조업 상장사를 기준으로 만든 계수라 1.8, 3.0 같은 절대 기준으로 읽지 않습니다.",
  },
  accrualRatio: {
    label: "발생액 비율",
    description:
      "당기순이익에서 영업활동현금흐름을 뺀 값을 총자산으로 나눈 값입니다. 클수록 장부이익이 현금으로 뒷받침되지 않는다는 뜻입니다.",
  },
  earningsQuality: {
    label: "이익의 질",
    description:
      "영업활동현금흐름을 당기순이익으로 나눈 값입니다. 1 미만이 이어지면 장부이익을 의심할 근거가 됩니다.",
  },
  ncavMultiple: {
    label: "NCAV 배수",
    description:
      "유동자산에서 부채총계를 뺀 값을 시가총액으로 나눈 값입니다. 그레이엄의 순유동자산 배수로, 청산가치가 시가총액보다 큰 극단적 저평가를 잡습니다.",
  },
  netMargin: {
    label: "순이익률 (DuPont)",
    description:
      "당기순이익을 매출액으로 나눈 값입니다. ROE를 마진·회전율·레버리지로 쪼갠 DuPont 3분해 중 마진 부분입니다.",
  },
  assetTurnover: {
    label: "자산회전율 (DuPont)",
    description: "매출액을 자산총계로 나눈 값입니다. 자산을 얼마나 활발히 굴려 매출을 내는지를 봅니다.",
  },
  leverage: {
    label: "재무레버리지 (DuPont)",
    description: "자산총계를 자본총계로 나눈 값입니다. 같은 ROE라도 빚을 얼마나 썼는지를 가릅니다.",
  },
  effectiveTaxRate: {
    label: "실효법인세율",
    description:
      "세전이익에서 당기순이익을 뺀 값을 세전이익으로 나눈 값입니다. 0% 미만이거나 50%를 넘으면 일회성 손익을 의심할 근거가 됩니다.",
  },
};
