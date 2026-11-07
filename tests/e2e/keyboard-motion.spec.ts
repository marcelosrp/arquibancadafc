import { expect, test, type Page } from "@playwright/test";

/** Tab pelos elementos interativos e confere que cada um mostra anel de foco. */
async function expectVisibleFocusRings(page: Page, minimum: number) {
  let withRing = 0;
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const handle = await page.evaluateHandle(() =>
      document.activeElement === document.body ? null : document.activeElement,
    );
    const el = handle.asElement();
    if (!el) continue;
    const snap = () =>
      el.evaluate((node) => {
        const cs = getComputedStyle(node);
        return [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.boxShadow].join(" | ");
      });
    await page.waitForTimeout(150); // deixa a transição do anel terminar
    const focused = await snap();
    // O anel é a diferença entre focado e não focado (o estado base não conta).
    await el.evaluate((node) => (node as HTMLElement).blur());
    await page.waitForTimeout(150);
    const baseline = await snap();
    await el.evaluate((node) => (node as HTMLElement).focus());
    const tag = await el.evaluate((node) => node.tagName);
    expect(focused, `sem anel de foco em ${tag}`).not.toBe(baseline);
    withRing++;
  }
  expect(withRing).toBeGreaterThanOrEqual(minimum);
}

test.describe("foco visível por teclado", () => {
  test("landing", async ({ page }) => {
    await page.goto("/");
    await expectVisibleFocusRings(page, 4);
  });

  test("login", async ({ page }) => {
    await page.goto("/login");
    await expectVisibleFocusRings(page, 4);
  });
});

test.describe("prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("animações da landing ficam praticamente instantâneas", async ({ page }) => {
    await page.goto("/");
    const durations = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("main *, header *"))
        .map((el) => getComputedStyle(el))
        .filter((cs) => cs.animationName !== "none")
        .map((cs) => parseFloat(cs.animationDuration) * (cs.animationDuration.endsWith("ms") ? 1 : 1000)),
    );
    expect(durations.length).toBeGreaterThan(0);
    for (const d of durations) expect(d).toBeLessThanOrEqual(1);
  });
});
