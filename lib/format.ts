/**
 * 화면에 지표를 보여주기 위한 표시 형식.
 *
 * 계산이 아니라 표기만 다루므로 지표 계산 자체는 여기서 하지 않는다.
 */
import type { FinancialStatementBasis } from "@/lib/dart/client";
import type { StatementBasis } from "@/lib/fsc/response";
import type { AnomalyFlag } from "@/lib/metrics/flags";

/** 원 단위 금액을 조·억 단위로 줄여 보여준다. */
export function formatWon(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  const jo = Math.floor(abs / 1e12);
  const eok = Math.floor((abs % 1e12) / 1e8);
  if (jo > 0) return `${sign}${jo}조 ${eok.toLocaleString("ko-KR")}억`;
  return `${sign}${eok.toLocaleString("ko-KR")}억`;
}

/** 0.1185 같은 소수 비율을 "11.9%"로 보여준다. */
export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** 45.6 같은 배율을 "45.6배"로 보여준다. */
export function formatMultiple(value: number, digits = 1): string {
  return `${value.toFixed(digits)}배`;
}

/** 0~100 백분위를 정수로 반올림해 "82%"로 보여준다. */
export function formatPercentile(percentile: number): string {
  return `${Math.round(percentile)}%`;
}

/** YYYYMMDD 문자열을 "2026-09-16"으로 보여준다. */
export function formatBasDt(basDt: string): string {
  if (basDt.length !== 8) return basDt;
  return `${basDt.slice(0, 4)}-${basDt.slice(4, 6)}-${basDt.slice(6, 8)}`;
}

// Record를 실제 플래그·기준 타입으로 키를 잡으면, 나중에 그 타입에 값이
// 하나 늘었을 때 여기를 안 고치면 타입 검사에서 바로 걸린다. 원시 문자열
// 키였다면 오타나 누락이 조용히 원본 코드를 그대로 노출하고 지나갔을 것이다.
const FLAG_LABEL: Record<AnomalyFlag, string> = {
  "tax-rate-out-of-range": "실효세율 이상",
  "per-too-low": "PER 과소",
  "earnings-swing": "순이익 급변",
  "low-earnings-quality": "이익의 질 낮음",
};

/** 이상치 플래그 코드를 짧은 한글 배지 문구로 바꾼다. */
export function describeFlag(flag: AnomalyFlag): string {
  return FLAG_LABEL[flag];
}

const FSC_BASIS_LABEL: Record<StatementBasis, string> = {
  consolidated: "연결",
  separate: "별도",
};

const DART_BASIS_LABEL: Record<FinancialStatementBasis, string> = {
  CFS: "연결",
  OFS: "개별",
};

/** 금융위 재무 기준(연결요약재무제표/별도요약재무제표)을 한글로 보여준다. */
export function formatFscBasis(basis: StatementBasis | null): string {
  if (!basis) return "확인 불가";
  return FSC_BASIS_LABEL[basis];
}

/** OpenDART 재무제표 기준(연결/개별)을 한글로 보여준다. */
export function formatDartBasis(basis: FinancialStatementBasis | null): string {
  if (!basis) return "확인 불가";
  return DART_BASIS_LABEL[basis];
}
