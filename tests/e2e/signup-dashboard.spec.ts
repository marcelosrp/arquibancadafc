import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers";

test("cadastro com busca e seleção do clube cai no dashboard do clube, na temporada do override", async ({
  page,
}) => {
  await signUp(page, { email: uniqueEmail("signup") });

  await expect(page.getByRole("heading", { name: "Flamengo", level: 1 })).toBeVisible();
  await expect(page.getByText("2024").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Serie A" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Próxima partida" })).toContainText("Flamengo x São Paulo");
});
