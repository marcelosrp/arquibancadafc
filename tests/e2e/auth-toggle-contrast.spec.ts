import { expect, test } from "@playwright/test";

function ratio(a: number[], b: number[]) {
  const lum = ([r, g, bl]: number[]) => {
    const f = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test("botão de tema é visível sobre o painel da marca em tela estreita no tema escuro", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("arquibancada-theme", "dark"));
  await page.goto("/login");
  await expect(page.locator("html")).toHaveClass(/dark/);

  const { fg, bg } = await page.evaluate(() => {
    const toRgb = (v: string) => {
      const c = document.createElement("canvas").getContext("2d")!;
      c.fillStyle = "#000";
      c.fillStyle = v;
      c.fillRect(0, 0, 1, 1);
      return Array.from(c.getImageData(0, 0, 1, 1).data).slice(0, 3);
    };
    const btn = document.querySelector("button[aria-label='Tema'], button[title='Tema']") ??
      Array.from(document.querySelectorAll("button")).find((b) => /tema/i.test(b.textContent + (b.getAttribute("aria-label") ?? "")))!;
    const aside = document.querySelector("aside")!;
    return {
      fg: toRgb(getComputedStyle(btn).color),
      bg: toRgb(getComputedStyle(aside).backgroundColor),
    };
  });
  expect(ratio(fg, bg)).toBeGreaterThanOrEqual(3);
});
