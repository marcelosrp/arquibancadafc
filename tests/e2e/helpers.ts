import { expect, type Page } from "@playwright/test";

export const PASSWORD = "senha-segura-123";

export function uniqueEmail(label: string) {
  return `${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

/** Cadastro pela UI: busca o clube, seleciona e envia. Termina no dashboard. */
export async function signUp(page: Page, opts: { email: string; search?: string; team?: string }) {
  const { email, search = "flam", team = "Flamengo" } = opts;
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill("Torcedor Teste");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(PASSWORD);
  await page.getByLabel("Time do coração").fill(search);
  await page.getByRole("option", { name: new RegExp(team) }).getByRole("button").click();
  await expect(page.getByText(`Selecionado: ${team}`)).toBeVisible();
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
