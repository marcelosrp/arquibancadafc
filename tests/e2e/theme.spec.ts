import { expect, test, type Page } from "@playwright/test";

async function choose(page: Page, name: "Claro" | "Escuro" | "Sistema") {
  await page.getByRole("button", { name: "Tema" }).click();
  await page.getByRole("menuitem", { name }).click();
}

test.describe("seletor de tema", () => {
  test("Escuro aplica a classe dark e persiste após recarregar, antes da hidratação", async ({ page }) => {
    await page.goto("/login");
    await choose(page, "Escuro");
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Antes de qualquer script da página rodar, no primeiro paint após recarregar.
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        (window as unknown as { __darkAtDcl: boolean }).__darkAtDcl =
          document.documentElement.classList.contains("dark");
      });
    });
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(await page.evaluate(() => (window as unknown as { __darkAtDcl: boolean }).__darkAtDcl)).toBe(true);
  });

  test("Claro remove a classe dark", async ({ page }) => {
    await page.goto("/login");
    await choose(page, "Escuro");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await choose(page, "Claro");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("Sistema segue o esquema de cores do SO sem recarregar", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/login");
    await choose(page, "Sistema");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});
