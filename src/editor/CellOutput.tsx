import {
  SandpackProvider,
  SandpackPreview,
  SandpackConsole,
} from "@codesandbox/sandpack-react";

// The Sandpack runner for a single code cell (M2). This is the *only* module
// that imports @codesandbox/sandpack-react — it is loaded lazily (React.lazy in
// CodeCellView) so Sandpack's weight is paid only when a cell is first run, and
// so the headless vitest editor never pulls it in.
//
// M2 is deliberately one-cell-per-sandbox: each run mounts an isolated project
// from the cell's code. The shared-project + reactive `$` runtime is the M3
// rework. `nonce` keys the provider so every Run remounts a fresh sandbox.
interface CellOutputProps {
  code: string;
  nonce: number;
}

export default function CellOutput({ code, nonce }: CellOutputProps) {
  return (
    <div className="code-cell__output">
      <SandpackProvider
        key={nonce}
        template="vanilla-ts"
        // Override only the entry (`/index.ts` is the vanilla-ts entry); keep the
        // template's own index.html so Parcel's HTML asset stays valid and the
        // preview actually renders the cell's DOM output.
        files={{ "/index.ts": code }}
      >
        <SandpackPreview
          showOpenInCodeSandbox={false}
          showRefreshButton
          style={{ height: 180 }}
        />
        <SandpackConsole />
      </SandpackProvider>
    </div>
  );
}
