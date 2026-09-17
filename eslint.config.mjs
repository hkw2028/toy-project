import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 외부에서 가져온 스킬 내용. 이 프로젝트가 규칙을 강제할 대상이 아니다.
    ".claude/skills/**",
    ".agents/skills/**",
    // 생성되는 지표 스냅샷.
    "data/**",
  ]),
]);

export default eslintConfig;
