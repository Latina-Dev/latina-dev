import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = ["/", "/members", "/members/frances-coronel"];

for (const path of pages) {
  test(`${path} loads without serious accessibility issues`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("main").getByRole("heading").first()).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });
}

test("member feed lists every profile", async ({ request }) => {
  const response = await request.get("/members.json");
  expect(response.ok()).toBe(true);
  const body = await response.json();
  const members = Array.isArray(body) ? body : body.members;
  expect(members.length).toBeGreaterThan(0);
});
