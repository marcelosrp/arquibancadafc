import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers";

test.describe("landing page", () => {
  test("visitante vê a proposta de valor e os links de entrada", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).not.toHaveText(/^\s*$/);

    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "Entrar", exact: true })).toHaveAttribute("href", "/login");
    await expect(header.getByRole("link", { name: "Criar conta", exact: true })).toHaveAttribute("href", "/cadastro");

    // Os CTAs da página toda apontam para os mesmos destinos.
    const entrar = page.getByRole("link", { name: /^Entrar/ });
    const criar = page.getByRole("link", { name: /^Criar (minha )?conta/ });
    expect(await entrar.count()).toBeGreaterThanOrEqual(1);
    expect(await criar.count()).toBeGreaterThanOrEqual(1);
    for (const link of await entrar.all()) {
      await expect(link).toHaveAttribute("href", "/login");
    }
    for (const link of await criar.all()) {
      await expect(link).toHaveAttribute("href", "/cadastro");
    }
  });

  test("Como funciona tem exatamente 3 passos", async ({ page }) => {
    await page.goto("/");
    const section = page.getByRole("region", { name: "Como funciona" });
    const steps = section.getByRole("listitem");
    await expect(steps).toHaveCount(3);
    await expect(steps.nth(0)).toContainText(/crie sua conta/i);
    await expect(steps.nth(1)).toContainText(/escolha o (seu )?time/i);
    await expect(steps.nth(2)).toContainText(/acompanhe/i);
  });

  test("Entrar leva ao login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("banner").getByRole("link", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("usuário logado em / termina no dashboard", async ({ page }) => {
    await signUp(page, { email: uniqueEmail("landing") });
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("/dashboard sem sessão termina no login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test.describe("celular 360px", () => {
    test.use({ viewport: { width: 360, height: 780 } });

    test("sem rolagem horizontal", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
});
