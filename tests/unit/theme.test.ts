import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import {
  THEME_STORAGE_KEY,
  parsePreference,
  resolveTheme,
  themeInitScript,
} from "@/lib/theme";

function run(opts: {
  stored?: string | null;
  throws?: boolean;
  matches?: boolean;
}) {
  const classes = new Set<string>();
  const listeners: Array<() => void> = [];
  const mql = {
    matches: opts.matches ?? false,
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
  };
  const ctx = {
    localStorage: {
      getItem: (key: string) => {
        if (opts.throws) throw new Error("denied");
        return key === THEME_STORAGE_KEY ? (opts.stored ?? null) : null;
      },
    },
    window: { matchMedia: () => mql },
    document: {
      documentElement: {
        classList: {
          add: (c: string) => classes.add(c),
          remove: (c: string) => classes.delete(c),
          toggle: (c: string, force?: boolean) => {
            if (force) classes.add(c);
            else classes.delete(c);
          },
        },
      },
    },
  };
  (ctx as Record<string, unknown>).matchMedia = ctx.window.matchMedia;
  runInNewContext(themeInitScript, ctx);
  return { classes, listeners, mql };
}

describe("theme preference", () => {
  it("parses preferences", () => {
    expect(parsePreference(null)).toBe("system");
    expect(parsePreference("lixo")).toBe("system");
    expect(parsePreference("dark")).toBe("dark");
    expect(parsePreference("light")).toBe("light");
  });
  it("resolves theme", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});

describe("themeInitScript", () => {
  it("applies dark from storage", () => {
    expect(run({ stored: "dark" }).classes.has("dark")).toBe(true);
  });
  it("does not throw when storage throws and uses matchMedia", () => {
    expect(run({ throws: true, matches: true }).classes.has("dark")).toBe(true);
  });
  it("follows system changes when preference is system", () => {
    const { classes, listeners, mql } = run({ stored: "system", matches: true });
    expect(classes.has("dark")).toBe(true);
    mql.matches = false;
    listeners.forEach((fn) => fn());
    expect(classes.has("dark")).toBe(false);
  });
});
