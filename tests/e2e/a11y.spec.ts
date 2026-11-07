import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers";

const THEMES = ["light", "dark"] as const;
const VIEWPORTS = [
  { name: "desktop 1280px", width: 1280, height: 800 },
  { name: "celular 390px", width: 390, height: 844 },
];

let storageState: Awaited<ReturnType<BrowserContext["storageState"]>>;
let competitionPath = "";

test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUp(page, { email: uniqueEmail("a11y") });
  await page.goto("/dashboard");
  const href = await page.locator('a[href^="/competicoes/"]').first().getAttribute("href");
  competitionPath = href ?? "";
  storageState = await ctx.storageState();
  await ctx.close();
});

async function newPage(
  browser: Browser,
  opts: { theme: (typeof THEMES)[number]; width: number; height: number; authed: boolean },
) {
  const ctx = await browser.newContext({
    viewport: { width: opts.width, height: opts.height },
    reducedMotion: "reduce",
    locale: "pt-BR",
    baseURL: "http://localhost:3100",
    storageState: opts.authed ? storageState : undefined,
  });
  await ctx.addInitScript((theme) => {
    try {
      localStorage.setItem("arquibancada-theme", theme);
    } catch {}
  }, opts.theme);
  return { ctx, page: await ctx.newPage() };
}

/**
 * Camadas decorativas (aria-hidden: listras do gramado, gradientes) impedem o axe de resolver o
 * fundo ("incomplete"); escondê-las deixa o axe medir contra o fundo real. São tintas de 6-7%.
 */
const HIDE_DECORATION = '[aria-hidden="true"]:not(svg):not(svg *){visibility:hidden !important}';

async function runAxe(page: Page) {
  return new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).withRules(["color-contrast"]).analyze();
}

async function audit(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: HIDE_DECORATION });
  let results = await runAxe(page);
  // Primeira carga a frio às vezes deixa o axe sem resolver o fundo: mede de novo uma vez.
  if (results.incomplete.length > 0) {
    await page.waitForTimeout(500);
    results = await runAxe(page);
  }
  const fmt = (kind: string, list: typeof results.violations) =>
    list.map((v) => ({
      id: `${kind}:${v.id}`,
      nodes: v.nodes.map((n) => `${n.target.join(" ")} :: ${n.any[0]?.message ?? n.failureSummary}`),
    }));
  // "incomplete" também reprova: contraste não verificado não pode passar em silêncio.
  return [...fmt("violation", results.violations), ...fmt("incomplete", results.incomplete)];
}

for (const theme of THEMES) {
  for (const vp of VIEWPORTS) {
    test(`axe (contraste e WCAG A/AA): ${theme}, ${vp.name}`, async ({ browser }) => {
      test.setTimeout(120_000);
      const publicPaths = ["/", "/login", "/cadastro"];
      const authedPaths = ["/dashboard", competitionPath, "/perfil"];
      expect(competitionPath).toMatch(/^\/competicoes\//);
      const found: Record<string, unknown> = {};

      const anon = await newPage(browser, { theme, ...vp, authed: false });
      for (const p of publicPaths) found[p] = await audit(anon.page, p);
      await anon.ctx.close();

      const auth = await newPage(browser, { theme, ...vp, authed: true });
      for (const p of authedPaths) found[p] = await audit(auth.page, p);
      await auth.ctx.close();

      const failing = Object.fromEntries(
        Object.entries(found).filter(([, v]) => (v as unknown[]).length > 0),
      );
      expect(failing, JSON.stringify(failing, null, 2)).toEqual({});
    });
  }
}
