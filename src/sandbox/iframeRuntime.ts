import { createEngine } from "../runtime";
import { compile, resolveModule } from "./compile";
import type { HostMessage, RuntimeMessage } from "./protocol";

// This module runs INSIDE the sandbox iframe. It owns one reactive engine, wires
// it to the transpile layer (./compile), mounts cell views into host containers,
// and relays outputs back to the host. The bundle never reloads, so the shared
// `$` and all cell state persist across edits.

const engine = createEngine();

const post = (msg: RuntimeMessage) => parent.postMessage(msg, "*");

engine.onOutput((output) => post({ type: "output", output }));

// Register a cell, surfacing resolution/compile/syntax errors as that cell's
// output instead of throwing across the boundary.
async function setCell(id: string, code: string) {
  try {
    engine.setCell(id, await compile(code));
  } catch (e) {
    post({
      type: "output",
      output: {
        id,
        values: {},
        reads: [],
        logs: [],
        error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      },
    });
  }
}

// --- view mounting (same-origin side-channel) ------------------------------
//
// A cell's view is a live DOM node or React element that can't cross postMessage,
// so the host (same-origin) hands us its output container and we mount the current
// value into it directly. Re-called by the host on every re-run (output change).
// Exposed as window globals the host invokes via contentWindow.
interface ViewGlobals {
  __telestrator_mountView(id: string, container: Element): void;
  __telestrator_unmountView(container: Element): void;
}

type ReactRoot = { render(el: unknown): void; unmount(): void };
type ReactDomClient = { createRoot(el: Element): ReactRoot };

// react-dom is loaded lazily (only when a cell first returns a React element) and
// resolves to the same pinned react instance the cell's JSX uses (see toUrl).
let reactDomPromise: Promise<ReactDomClient> | null = null;
const getReactDom = (): Promise<ReactDomClient> =>
  (reactDomPromise ??= resolveModule("react-dom/client").then(
    (m) => m as unknown as ReactDomClient,
  ));

// One React root per output container, torn down when the view goes away or
// switches to a DOM node.
const roots = new Map<Element, ReactRoot>();
const clearRoot = (container: Element) => {
  const root = roots.get(container);
  if (root) {
    root.unmount();
    roots.delete(container);
  }
};

const isReactEl = (v: unknown): boolean =>
  !!v &&
  typeof v === "object" &&
  (v as { $$typeof?: unknown }).$$typeof === Symbol.for("react.element");
const isNode = (v: unknown): boolean =>
  !!v && typeof (v as { nodeType?: unknown }).nodeType === "number";

const w = window as unknown as ViewGlobals;
w.__telestrator_mountView = (id, container) => {
  const value = engine.getValue(id);
  if (isReactEl(value)) {
    getReactDom().then((ReactDOM) => {
      // The cell may have re-run while react-dom loaded; render the latest value.
      const current = engine.getValue(id);
      if (!isReactEl(current)) return clearRoot(container);
      let root = roots.get(container);
      if (!root) roots.set(container, (root = ReactDOM.createRoot(container)));
      root.render(current);
    });
  } else if (isNode(value)) {
    clearRoot(container);
    container.replaceChildren(value as Node);
  } else {
    clearRoot(container);
    container.replaceChildren();
  }
};
w.__telestrator_unmountView = (container) => {
  clearRoot(container);
  container.replaceChildren();
};

window.addEventListener("message", (event: MessageEvent<HostMessage>) => {
  const msg = event.data;
  switch (msg?.type) {
    case "load":
      for (const cell of msg.cells) void setCell(cell.id, cell.code);
      break;
    case "update":
      void setCell(msg.id, msg.code);
      break;
    case "remove":
      engine.removeCell(msg.id);
      break;
    case "restart":
      engine.restart();
      break;
  }
});

post({ type: "ready" });
