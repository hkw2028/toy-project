import { expect, test } from "@playwright/test";

test("규칙을 바꾸면 URL과 결과가 함께 바뀌고, 그 URL은 다시 열어도 재현된다", async ({
  page,
  context,
}) => {
  await page.goto("/");

  const summaryBefore = await page.getByText(/모집단 .+종목 중/).textContent();

  // Altman Z 백분위 하한을 크게 올려 확실히 다른 결과가 나오게 한다.
  await page.getByLabel("Altman Z 백분위 하한").fill("90");
  await page.getByRole("button", { name: "규칙 적용" }).click();

  await expect(page).toHaveURL(/z=90/);
  const summaryAfter = await page.getByText(/모집단 .+종목 중/).textContent();
  expect(summaryAfter).not.toBe(summaryBefore);

  const firstNameAfter = await page
    .getByTestId("stock-name")
    .first()
    .textContent();

  // 바뀐 URL을 완전히 새 컨텍스트(새 창에 해당)에서 열어 같은 결과가 재현되는지 본다.
  const freshPage = await context.newPage();
  await freshPage.goto(page.url());
  await expect(freshPage.getByText(/모집단 .+종목 중/)).toHaveText(
    summaryAfter ?? "",
  );
  const firstNameFresh = await freshPage
    .getByTestId("stock-name")
    .first()
    .textContent();
  expect(firstNameFresh).toBe(firstNameAfter);
  await freshPage.close();
});

test("아무도 통과하지 못하는 규칙을 넣으면 빈 결과 상태가 보인다", async ({
  page,
}) => {
  await page.goto(
    "/?evebit=1&roic=99&fcf=99&z=99&n=20",
  );

  await expect(page.getByText("통과한 종목이 없습니다")).toBeVisible();
  await expect(page.getByText(/규칙을 통과한/)).toContainText("0종목");
});

test("좁은 화면에서는 표 대신 종목별 카드가 쌓인다", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");

  await expect(page.getByRole("table")).toBeHidden();
  await expect(page.locator("[data-slot=card]").first()).toBeVisible();
});

test("넓은 화면에서는 종목이 표로 보인다", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await expect(page.getByRole("table")).toBeVisible();
});

test("종목 하나를 펼치면 상세 지표가 보이고, 다시 누르면 접힌다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  const toggle = page.getByRole("button", { name: /상세 지표 펼치기/ }).first();
  await toggle.click();
  await expect(page.getByText("실효법인세율").first()).toBeVisible();

  await page.getByRole("button", { name: /상세 지표 닫기/ }).first().click();
  await expect(page.getByText("실효법인세율")).toHaveCount(0);
});

async function marketCaps(page: import("@playwright/test").Page) {
  return page.locator("table tbody tr[data-market-cap]").evaluateAll((rows) =>
    rows.map((r) => Number(r.getAttribute("data-market-cap"))),
  );
}

test("기본 정렬은 시가총액 내림차순이다", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  const caps = await marketCaps(page);
  expect(caps.length).toBeGreaterThan(1);
  expect(caps).toEqual([...caps].sort((a, b) => b - a));
});

test("열 헤더를 누르면 그 기준으로 정렬되고, 다시 누르면 방향이 뒤집힌다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  const perHeader = page.getByRole("link", { name: /^PER/ });
  await perHeader.click();
  await expect(page).toHaveURL(/sort=per&dir=desc/);
  const perDesc = await page
    .locator("table tbody tr[data-per]")
    .evaluateAll((rows) => rows.map((r) => Number(r.getAttribute("data-per"))));
  expect(perDesc).toEqual([...perDesc].sort((a, b) => b - a));

  await page.getByRole("link", { name: /^PER/ }).click();
  await expect(page).toHaveURL(/sort=per&dir=asc/);
  const perAsc = await page
    .locator("table tbody tr[data-per]")
    .evaluateAll((rows) => rows.map((r) => Number(r.getAttribute("data-per"))));
  expect(perAsc).toEqual([...perAsc].sort((a, b) => a - b));
});

test("헤더의 설명 아이콘에 마우스를 올리면 지표 설명이 보인다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await page.getByRole("button", { name: "EV/EBIT 설명" }).hover();
  await expect(page.getByText(/순부채 근사/)).toBeVisible();
});
