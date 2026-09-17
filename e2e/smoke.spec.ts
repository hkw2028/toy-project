import { expect, test } from "@playwright/test";

test("홈 화면이 열리고 스크리너 제목과 규칙 폼이 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("국내 상장종목 스크리너");
  await expect(
    page.getByRole("heading", { level: 1, name: "국내 상장종목 스크리너" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "규칙 적용" }),
  ).toBeVisible();
});
