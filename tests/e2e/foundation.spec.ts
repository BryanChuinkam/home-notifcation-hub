import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("foundation communicates its scope and exposes health on desktop and mobile", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Home Notification Hub" })).toBeVisible();
  await expect(page.getByText("No household devices are connected.", { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(accessibility.violations).toEqual([]);
  await page.getByRole("link", { name: "Check application health" }).focus();
  await expect(page.getByRole("link", { name: "Check application health" })).toBeFocused();
  const response = await page.request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: "ok", stage: "foundation" });
});
