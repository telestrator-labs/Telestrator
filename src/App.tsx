import { NotebookEditor } from "./editor/NotebookEditor";

// M1: the static M0 round-trip demo is replaced by the real block editor, which
// reads and writes the same core `NotebookDocument` and persists to localStorage.
export default function App() {
  return <NotebookEditor />;
}
