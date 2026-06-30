import { NotebookEditor } from "./editor/NotebookEditor";
import { RuntimeProvider } from "./editor/RuntimeProvider";

// M3: the editor is wrapped in the reactive RuntimeProvider, which owns the
// notebook's shared `$` runtime (a sandbox iframe). TypeScript cells register
// into it and re-run reactively when the `$` values they read change.
export default function App() {
  return (
    <RuntimeProvider>
      <NotebookEditor />
    </RuntimeProvider>
  );
}
