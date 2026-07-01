import { useEffect, useRef } from "react";

// Wrap interactive widgets inside a Tiptap node view so the editor doesn't steal
// pointer focus from them. ProseMirror listens for mousedown/pointerdown on
// `view.dom` (an ancestor); a React onMouseDown is delegated at the React root
// (above view.dom) and fires too late. Attaching *native* listeners here, on a
// descendant, stops the event before it bubbles to view.dom — so the editor
// never node-selects the cell or re-focuses, and a popup (Popover) opened from
// within keeps focus instead of having it yanked back to the editor.
export function StopEditorEvents({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener("mousedown", stop);
    el.addEventListener("pointerdown", stop);
    return () => {
      el.removeEventListener("mousedown", stop);
      el.removeEventListener("pointerdown", stop);
    };
  }, []);
  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  );
}
