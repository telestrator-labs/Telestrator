// The one data model everything hangs off — see
// .docs/greenfield-build-guide.md (M0). A notebook is an ordered list of
// typed cells; every later milestone reads and writes this same shape.

export type Language = "markdown" | "typescript" | "css";

export interface Cell {
  id: string; // stable id; survives reorder
  language: Language;
  code: string; // source text (prose for markdown cells)
}

export interface NotebookDocument {
  id: string;
  title: string;
  cells: Cell[];
}

// Portable id generation: browsers and modern runtimes expose
// `crypto.randomUUID()`; the fallback keeps older/edge runtimes working so the
// project isn't tied to any one Node version.
function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
    const n = Number(c);
    return (n ^ (Math.floor(Math.random() * 256) & (15 >> (n / 4)))).toString(
      16,
    );
  });
}

export function createCell(language: Language, code = ""): Cell {
  return { id: generateId(), language, code };
}

export function createNotebook(title = "Untitled"): NotebookDocument {
  return {
    id: generateId(),
    title,
    cells: [createCell("markdown", "# Hello\n\nStart typing…")],
  };
}

export function serialize(doc: NotebookDocument): string {
  return JSON.stringify(doc, null, 2);
}

export function deserialize(json: string): NotebookDocument {
  const parsed = JSON.parse(json) as NotebookDocument;
  if (!parsed.id || !Array.isArray(parsed.cells)) {
    throw new Error("Invalid notebook document");
  }
  return parsed;
}
