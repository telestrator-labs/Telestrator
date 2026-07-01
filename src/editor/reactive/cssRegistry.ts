// Applies css cells. A css cell's text is injected as a `<style>` in the host
// <head>, with every selector prefixed `.telestrator-output` so its rules only
// style cell *output* regions (each output container carries that class), never
// the editor chrome — while staying globally reachable, so one cell's classes
// style another cell's DOM output. Ported from TypeCell's `.typecell-output`
// scoping (DefaultOutputVisualizer.tsx), rebranded to this project.

export const OUTPUT_CLASS = "telestrator-output";
const SCOPE = `.${OUTPUT_CLASS}`;

const styles = new Map<string, HTMLStyleElement>();

// Prefix each comma-separated selector part with the output scope:
// `.card, h1` → `.telestrator-output .card, .telestrator-output h1`. A root-ish
// selector (`:root`/`html`/`body`) is *replaced* by the output scope (not nested
// under it) so custom properties / base styles a css cell declares land on the
// output container and cascade to the mounted view.
function scopeSelector(selector: string): string {
  return selector
    .split(",")
    .map((part) => {
      const p = part.trim();
      return /^(:root|html|body)$/i.test(p) ? SCOPE : `${SCOPE} ${p}`;
    })
    .join(", ");
}

// Walk a rule list and scope style rules; recurse into @media/@supports. Rules
// without a selector (@keyframes, @font-face) are left untouched. Duck-typed so
// it works in both the browser and jsdom (where CSSMediaRule may be absent).
function scopeRules(rules: CSSRuleList): void {
  for (const rule of Array.from(rules) as Array<
    CSSRule & { selectorText?: string; cssRules?: CSSRuleList }
  >) {
    if (typeof rule.selectorText === "string") {
      rule.selectorText = scopeSelector(rule.selectorText);
    } else if (rule.cssRules) {
      scopeRules(rule.cssRules);
    }
  }
}

// A css cell's public API, for a *named* cell to publish to `$`: class names
// (Flavor A: pass through as-is, so they match the injected rules) and custom
// properties (as `var(--name)` references). Regex over the raw text — a light
// heuristic, no CSSOM needed (works headless).
export function parseApi(code: string): {
  classes: Record<string, string>;
  vars: Record<string, string>;
} {
  const classes: Record<string, string> = {};
  for (const m of code.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) classes[m[1]] = m[1];
  const vars: Record<string, string> = {};
  for (const m of code.matchAll(/--([A-Za-z_][\w-]*)\s*:/g))
    vars[m[1]] = `var(--${m[1]})`;
  return { classes, vars };
}

export const cssRegistry = {
  // Inject or update a css cell's stylesheet, scoped to output regions.
  set(id: string, code: string): void {
    if (typeof document === "undefined") return;
    let el = styles.get(id);
    if (!el) {
      el = document.createElement("style");
      el.setAttribute("data-telestrator-css", id);
      document.head.appendChild(el);
      styles.set(id, el);
    }
    el.textContent = code;
    try {
      if (el.sheet) scopeRules(el.sheet.cssRules);
    } catch {
      // Malformed CSS / CSSOM quirks: leave the raw text applied unscoped rather
      // than throwing. (Author still sees their styles; scoping is best-effort.)
    }
  },

  // Remove a css cell's stylesheet (on delete, language change, or restart).
  remove(id: string): void {
    const el = styles.get(id);
    if (el) {
      el.remove();
      styles.delete(id);
    }
  },
};
