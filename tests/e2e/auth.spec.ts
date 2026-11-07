import { expect, test } from "@playwright/test";
import { PASSWORD, signUp, uniqueEmail } from "./helpers";

test("login e logout", async ({ page }) => {
  const email = uniqueEmail("auth");
  await signUp(page, { email });
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.locator("input[name=email]:visible").fill(email);
  await page.locator("input[name=password]:visible").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Flamengo", level: 1 })).toBeVisible();
});

test("login com senha errada mostra erro", async ({ page }) => {
  const email = uniqueEmail("auth-bad");
  await signUp(page, { email });
  await page.getByRole("button", { name: "Sair" }).click();
  await page.locator("input[name=email]:visible").fill(email);
  await page.locator("input[name=password]:visible").fill("senha-errada-999");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha inválidos.")).toBeVisible();
});

for (const path of ["/dashboard", "/perfil", "/competicoes/00000000-0000-4000-8000-000000000000"]) {
  test(`rota protegida ${path} redireciona para o login sem sessão`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  });
}
