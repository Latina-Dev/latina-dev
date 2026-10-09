import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = ["/", "/members", "/members/frances-coronel"];

for (const path of pages) {
  test(`${path} loads without serious accessibility issues`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    // List each failing element so CI logs show exactly what to fix
    const problems = serious.flatMap((v) =>
      v.nodes.map((node) => `${v.id}: ${node.target.join(" ")}\n${node.failureSummary}`)
    );
    expect(problems).toEqual([]);
  });
}

test("member feed lists every profile", async ({ request }) => {
  const response = await request.get("/members.json");
  expect(response.ok()).toBe(true);
  const body = await response.json();
  const members = Array.isArray(body) ? body : body.members;
  expect(members.length).toBeGreaterThan(0);
});
