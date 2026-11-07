import { expect, test } from "@playwright/test";
// Nota: com cacheComponents o Next mantém rotas anteriores ocultas no DOM (Activity), por isso contamos só main visível.
import { signUp, uniqueEmail } from "./helpers";

for (const [label, width, height] of [
  ["desktop", 1280, 800],
  ["celular", 390, 844],
] as const) {
  test.describe(`shell ${label}`, () => {
    test.use({ viewport: { width, height } });

    test("um único Sair e um único main", async ({ page }) => {
      await signUp(page, { email: uniqueEmail(`shell-${label}`) });
      await expect(page.getByRole("button", { name: "Sair" })).toHaveCount(1);
      await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
      await expect(page.locator("main:visible")).toHaveCount(1);
    });

    test("Perfil navega e marca aria-current; Competições vai para a âncora", async ({ page }) => {
      await signUp(page, { email: uniqueEmail(`shell-nav-${label}`) });
      const nav = page.getByRole("navigation");
      await expect(nav.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
      await nav.getByRole("link", { name: "Perfil" }).click();
      await expect(page).toHaveURL(/\/perfil$/);
      await expect(nav.getByRole("link", { name: "Perfil" })).toHaveAttribute("aria-current", "page");
      await expect(page.locator("main:visible")).toHaveCount(1);
      await nav.getByRole("link", { name: "Competições" }).click();
      await expect(page).toHaveURL(/\/dashboard#competicoes$/);
    });
  });
}
