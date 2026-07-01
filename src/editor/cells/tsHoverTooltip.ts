import type { EditorView, TooltipView } from "@codemirror/view";
import type { HoverInfo } from "@valtown/codemirror-ts";

// Renders the TypeScript hover ("type popover") content. We deliberately DON'T
// reach for our Radix Popover/Tooltip: those own their positioning, portal and
// open-state, which would fight CodeMirror's hover anchoring. CodeMirror already
// does the hard part — it positions this DOM against the hovered token with
// flip/shift — so we just supply the *content* and style it with our design
// tokens + the editor's syntax palette (see `.ts-hover` in editor/app.css). The
// signature keeps TS's per-token `quick-info-<kind>` classes so it reads like
// code; the JSDoc (if any) renders below in prose.
export function tsHoverTooltip(info: HoverInfo, _view: EditorView): TooltipView {
  const dom = document.createElement("div");
  dom.className = "ts-hover";

  const parts = info.quickInfo?.displayParts ?? [];
  if (parts.length) {
    const sig = dom.appendChild(document.createElement("div"));
    sig.className = "ts-hover__sig";
    for (const part of parts) {
      const span = sig.appendChild(document.createElement("span"));
      span.className = `quick-info-${part.kind}`;
      span.textContent = part.text;
    }
  }

  const docs = (info.quickInfo?.documentation ?? []).map((p) => p.text).join("");
  if (docs) {
    const el = dom.appendChild(document.createElement("div"));
    el.className = "ts-hover__doc";
    renderDoc(el, docs);
  }

  return { dom };
}

// The JSDoc comes through as Markdown. Render a minimal subset inline — links,
// `code`, and **bold** — so it reads cleanly instead of showing raw syntax. A
// `[text](url)` link renders as just its text (the address stays opaque) and
// opens the docs in a new background tab rather than navigating the notebook.
const MD = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*/g;

function renderDoc(container: HTMLElement, text: string): void {
  let last = 0;
  for (let m = MD.exec(text); m; m = MD.exec(text)) {
    if (m.index > last)
      container.appendChild(document.createTextNode(text.slice(last, m.index)));
    if (m[2] != null) {
      const a = container.appendChild(document.createElement("a"));
      a.textContent = m[1]; // show the label, not the URL
      a.href = m[2];
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      // Open in the background: let the new tab open, then pull focus back to the
      // notebook so the reader isn't yanked away from what they were reading.
      a.addEventListener("click", () => setTimeout(() => window.focus(), 0));
    } else if (m[3] != null) {
      container.appendChild(document.createElement("code")).textContent = m[3];
    } else if (m[4] != null) {
      container.appendChild(document.createElement("strong")).textContent = m[4];
    }
    last = m.index + m[0].length;
  }
  if (last < text.length)
    container.appendChild(document.createTextNode(text.slice(last)));
}
