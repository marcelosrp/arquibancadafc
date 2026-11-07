import { expect, test, type Page } from "@playwright/test";

/** Tab pelos elementos interativos e confere que cada um mostra anel de foco. */
async function expectVisibleFocusRings(page: Page, minimum: number) {
  let withRing = 0;
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const ring = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const outline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
      const shadow = cs.boxShadow !== "none" && cs.boxShadow !== "";
      return { tag: el.tagName, outline, shadow };
    });
    if (!ring) continue;
    expect(ring.outline || ring.shadow, `sem anel de foco em ${ring.tag}`).toBe(true);
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
