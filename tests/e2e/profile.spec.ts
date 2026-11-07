import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers";

test("perfil mostra o clube sem opção de troca", async ({ page }) => {
  await signUp(page, { email: uniqueEmail("profile") });
  await page.goto("/perfil");

  await expect(page.getByText("Time do coração")).toBeVisible();
  await expect(page.getByText("Flamengo", { exact: true })).toBeVisible();
  await expect(page.getByText("não pode ser alterado")).toBeVisible();
  // Nenhum controle para trocar de time.
  await expect(page.getByLabel("Time do coração")).toHaveCount(0);
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(page.getByRole("combobox")).toHaveCount(0);

  await page.getByLabel("Nome").fill("Novo Nome");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("status")).toHaveText("Perfil atualizado.");
});
