import type { CellOutput, RuntimeHost } from "../runtime";
import type { HostMessage, RuntimeMessage } from "./protocol";

// The plain-iframe RuntimeHost (M3 spike winner). It boots one long-lived iframe
// (the Vite-built `sandbox.html` entry, which runs the reactive engine) and then
// drives it purely by postMessage — cell source goes in as data, outputs come
// back. No bundler reload, so `$` state is preserved across edits.
//
// NOTE: the iframe uses `allow-scripts allow-same-origin` so its module fetches
// resolve same-origin. That isolates the *execution context* (its own globals;
// can't crash or pollute the editor window) but is NOT a security boundary
// against the parent origin. True null-origin isolation or a headless Sandpack
// client is the M4 hardening, where the keep/drop-Sandpack decision lands.
export function createIframeHost(): RuntimeHost {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
  iframe.style.display = "none";
  iframe.src = new URL("sandbox.html", location.origin).href;

  const listeners = new Set<(o: CellOutput) => void>();
  let ready = false;
  const queue: HostMessage[] = [];

  const send = (msg: HostMessage) => {
    if (ready && iframe.contentWindow)
      iframe.contentWindow.postMessage(msg, "*");
    else queue.push(msg);
  };

  const onMessage = (event: MessageEvent<RuntimeMessage>) => {
    if (event.source !== iframe.contentWindow) return;
    const msg = event.data;
    if (msg?.type === "ready") {
      ready = true;
      for (const q of queue) iframe.contentWindow?.postMessage(q, "*");
      queue.length = 0;
    } else if (msg?.type === "output") {
      for (const cb of listeners) cb(msg.output);
    }
  };

  window.addEventListener("message", onMessage);
  document.body.appendChild(iframe);

  // A cell's view is a live DOM node in the sandbox document; it can't cross
  // postMessage. Since the iframe is same-origin we call its exposed mount
  // functions directly, handing over the host-owned output container.
  interface ViewGlobals {
    __telestrator_mountView(id: string, container: Element): void;
    __telestrator_unmountView(container: Element): void;
  }
  const win = () =>
    ready ? (iframe.contentWindow as unknown as ViewGlobals | null) : null;

  return {
    load: (cells) => send({ type: "load", cells }),
    update: (id, code) => send({ type: "update", id, code }),
    remove: (id) => send({ type: "remove", id }),
    restart: () => send({ type: "restart" }),
    onOutput: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    mountView: (id, container) => win()?.__telestrator_mountView(id, container),
    unmountView: (container) => win()?.__telestrator_unmountView(container),
    dispose: () => {
      window.removeEventListener("message", onMessage);
      iframe.remove();
      listeners.clear();
    },
  };
}
