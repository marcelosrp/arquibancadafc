import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUp(page, { email: uniqueEmail("comp") });
});

test("liga mostra tabela de pontos corridos e assistências", async ({ page }) => {
  await page.getByRole("link", { name: "Serie A" }).click();
  await expect(page.getByRole("heading", { name: "Serie A", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Classificação" })).toBeVisible();
  await expect(page.getByRole("table").first()).toContainText("Flamengo");
  await expect(page.getByTestId("stages-view")).toHaveCount(0);
  await expect(page.getByRole("listitem").filter({ hasText: "Arrascaeta" })).toBeVisible();
});

test("copa mostra fases, não tabela de liga, e assistências indisponíveis", async ({ page }) => {
  await page.getByRole("link", { name: "Copa Do Brasil" }).click();
  await expect(page.getByRole("heading", { name: "Copa Do Brasil", level: 1 })).toBeVisible();
  await expect(page.getByTestId("stages-view")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fases" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Classificação" })).toHaveCount(0);

  const assists = page.locator("section", { has: page.getByRole("heading", { name: "Assistências" }) });
  await expect(assists.getByText("Dado indisponível")).toBeVisible();
  await expect(assists.getByText("0", { exact: true })).toHaveCount(0);
});

test("celular 360px: sem rolagem horizontal da página e Competições com aria-current", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.getByRole("link", { name: "Serie A" }).click();
  await expect(page.getByRole("heading", { name: "Serie A", level: 1 })).toBeVisible();
  await expect(page.getByRole("table").first()).toBeVisible();
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(fits).toBe(true);
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Competições" }),
  ).toHaveAttribute("aria-current", "page");
});

test("desktop: Competições com aria-current na página da competição", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("link", { name: "Serie A" }).click();
  await expect(page.getByRole("heading", { name: "Serie A", level: 1 })).toBeVisible();
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Competições" }),
  ).toHaveAttribute("aria-current", "page");
});
