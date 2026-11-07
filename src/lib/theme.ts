export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "arquibancada-theme";

export function parsePreference(raw: string | null): ThemePreference {
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
}

export function resolveTheme(
  pref: ThemePreference,
  systemDark: boolean,
): "light" | "dark" {
  if (pref === "system") return systemDark ? "dark" : "light";
  return pref;
}

// Self-contained IIFE injected in <head> so the theme is applied before paint.
export const themeInitScript = `(function(){
  var KEY = ${JSON.stringify(THEME_STORAGE_KEY)};
  var root = document.documentElement;
  var mql = null;
  try { mql = window.matchMedia("(prefers-color-scheme: dark)"); } catch (e) {}
  function read() {
    try {
      var v = localStorage.getItem(KEY);
      return v === "light" || v === "dark" || v === "system" ? v : "system";
    } catch (e) { return "system"; }
  }
  function apply() {
    var pref = read();
    var dark = pref === "dark" || (pref === "system" && !!mql && mql.matches);
    if (dark) root.classList.add("dark"); else root.classList.remove("dark");
  }
  apply();
  if (mql && mql.addEventListener) mql.addEventListener("change", apply);
})();`;
