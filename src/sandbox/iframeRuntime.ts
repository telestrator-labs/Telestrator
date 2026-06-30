import { transform } from "sucrase";
import { createEngine, type CellBody } from "../runtime";
import type { HostMessage, RuntimeMessage } from "./protocol";

// This module runs INSIDE the sandbox iframe. It owns one reactive engine,
// compiles cell source (TS → JS via sucrase, no bundling needed in M3), and
// relays outputs back to the host. The bundle never reloads, so the shared `$`
// and all cell state persist across edits — the property Sandpack's file loop
// can't give us.

const engine = createEngine();

const post = (msg: RuntimeMessage) => parent.postMessage(msg, "*");

engine.onOutput((output) => post({ type: "output", output }));

// Compile a cell's TS source into a body function over (`$`, `api`).
function compile(code: string): CellBody {
  const js = transform(code, { transforms: ["typescript"] }).code;
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("$", "api", js) as CellBody;
}

// Set a cell, surfacing compile/syntax errors as that cell's output instead of
// throwing across the boundary.
function setCell(id: string, code: string) {
  try {
    engine.setCell(id, compile(code));
  } catch (e) {
    post({
      type: "output",
      output: {
        id,
        values: {},
        logs: [],
        error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      },
    });
  }
}

window.addEventListener("message", (event: MessageEvent<HostMessage>) => {
  const msg = event.data;
  switch (msg?.type) {
    case "load":
      for (const cell of msg.cells) setCell(cell.id, cell.code);
      break;
    case "update":
      setCell(msg.id, msg.code);
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
