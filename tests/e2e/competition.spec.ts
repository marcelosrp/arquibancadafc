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
