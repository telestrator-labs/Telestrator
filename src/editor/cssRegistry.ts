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
// `.card, h1` → `.telestrator-output .card, .telestrator-output h1`.
function scopeSelector(selector: string): string {
  return selector.replace(/([^,]+,?)/g, `${SCOPE} $1 `).trim();
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
