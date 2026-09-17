import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { Snapshot } from "@/lib/universe/build";

const SNAPSHOT_PATH = join(process.cwd(), "data", "universe-latest.json");

/**
 * 가장 최근 스냅샷을 읽는다.
 *
 * 파일이 없으면(아직 `bun run universe`를 돌리지 않은 경우) null을 준다.
 * 화면은 이를 별도의 빈 상태로 보여줘야 하며, 다른 오류와 뭉뚱그리면 안 된다.
 */
export async function loadLatestSnapshot(): Promise<Snapshot | null> {
  try {
    const raw = await readFile(SNAPSHOT_PATH, "utf8");
    return JSON.parse(raw) as Snapshot;
  } catch (e) {
    if (isFileNotFound(e)) return null;
    throw e;
  }
}

function isFileNotFound(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "ENOENT"
  );
}
