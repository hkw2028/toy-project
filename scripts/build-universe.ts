/**
 * 지표 스냅샷을 만든다.
 *
 *   bun run universe            최신 사업연도로 만든다
 *   bun run universe 2024       사업연도를 직접 지정한다
 *
 * 인증키는 .env.local에서 읽는다. 결과는 data/universe-<기준일>.json과
 * data/universe-latest.json에 쓴다.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { DartBlockedError, DartKeyMissingError } from "@/lib/dart/client";
import { FscKeyMissingError } from "@/lib/fsc/client";
import { buildSnapshot, type StatementCache } from "@/lib/universe/build";

const OUT_DIR = join(process.cwd(), "data");

/**
 * 이미 받아 둔 재무제표를 보관한다.
 *
 * 종목 하나에 호출 하나가 필요한데다 짧은 시간에 몰아치면 차단을 받는다.
 * 중간에 멈추더라도 다시 실행할 때 남은 종목부터 이어받을 수 있어야 한다.
 */
function cachePath(bizYear: number): string {
  return join(OUT_DIR, `statements-${bizYear}.json`);
}

async function loadCache(bizYear: number): Promise<StatementCache> {
  try {
    const raw = await readFile(cachePath(bizYear), "utf8");
    return new Map(Object.entries(JSON.parse(raw)));
  } catch {
    return new Map();
  }
}

async function saveCache(bizYear: number, cache: StatementCache) {
  if (cache.size === 0) return;
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    cachePath(bizYear),
    JSON.stringify(Object.fromEntries(cache)),
  );
}

/**
 * 사업보고서는 이듬해 3월 말까지 제출된다. 그 전에는 직전 연도 수치가 아직
 * 없으므로 한 해 더 뒤로 잡는다.
 */
function defaultBizYear(now = new Date()): number {
  const year = now.getFullYear();
  return now.getMonth() >= 3 ? year - 1 : year - 2;
}

async function main() {
  const bizYear = Number(process.argv[2]) || defaultBizYear();
  const startedAt = Date.now();

  console.log(`사업연도 ${bizYear} 기준으로 스냅샷을 만듭니다.\n`);

  const cache = await loadCache(bizYear);
  let snapshot;
  try {
    snapshot = await buildSnapshot(bizYear, (m) => console.log(m), cache);
  } finally {
    // 중간에 멈춰도 여기까지 받은 것은 남긴다.
    await saveCache(bizYear, cache);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const json = JSON.stringify(snapshot);
  const dated = join(OUT_DIR, `universe-${snapshot.priceBasDt}.json`);
  const latest = join(OUT_DIR, "universe-latest.json");
  await writeFile(dated, json);
  await writeFile(latest, json);

  const c = snapshot.coverage;
  const pct = (n: number, d: number) => (d === 0 ? "0.0" : ((n / d) * 100).toFixed(1));

  console.log("\n── 확보율 ──────────────────────────────");
  console.log(`상장 종목            ${c.listed}`);
  console.log(`OpenDART 고유번호 연결 ${c.dartMapped} (${pct(c.dartMapped, c.listed)}%)`);
  console.log(`재무·시세 조인        ${c.fscJoined} (${pct(c.fscJoined, c.listed)}%)`);
  console.log(
    `재무제표 확보         ${c.statementsFetched} (${pct(c.statementsFetched, c.listed)}%)` +
      `  개별로 재시도 ${c.statementsRetriedAsSeparate}`,
  );
  console.log(`지표 완성            ${c.metricsComplete}`);
  console.log("────────────────────────────────────────");
  console.log(`재무 기준 사업연도 ${snapshot.bizYear}`);
  console.log(`시세 기준일       ${snapshot.priceBasDt}`);
  console.log(`상장 목록 기준일   ${snapshot.listedBasDt}`);
  console.log(`\n${dated}`);
  console.log(`${latest}`);
  console.log(`소요 ${((Date.now() - startedAt) / 1000).toFixed(1)}초`);
}

main().catch((e) => {
  if (
    e instanceof FscKeyMissingError ||
    e instanceof DartKeyMissingError ||
    e instanceof DartBlockedError
  ) {
    console.error(`\n${e.message}`);
    if (e instanceof DartBlockedError) {
      console.error(
        "여기까지 받은 재무제표는 남겨 두었습니다. 다시 실행하면 남은 종목부터 이어받습니다.",
      );
    }
  } else {
    console.error(`\n스냅샷 생성 실패: ${e instanceof Error ? e.message : e}`);
  }
  process.exit(1);
});
