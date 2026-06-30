import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { Editor, Range } from "@tiptap/core";

export interface SlashItem {
  title: string;
  hint?: string;
  run: (editor: Editor, range: Range) => void;
}

export interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SlashMenuProps {
  items: SlashItem[];
  command: (item: SlashItem) => void;
}

// The slash-command popup. The Suggestion plugin drives it imperatively
// (ReactRenderer), so keyboard nav is exposed via useImperativeHandle and reads
// live state from a ref (avoids the classic stale-closure bug). Styled with the
// design tokens.
export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  function SlashMenu({ items, command }, ref) {
    const [selected, setSelected] = useState(0);
    const stateRef = useRef({ selected, items, command });
    stateRef.current = { selected, items, command };

    // Reset the highlight when the filtered list changes.
    useEffect(() => setSelected(0), [items]);

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: ({ event }) => {
          const { selected, items, command } = stateRef.current;
          const n = items.length;
          if (n === 0) return false;
          if (event.key === "ArrowDown") {
            setSelected((selected + 1) % n);
            return true;
          }
          if (event.key === "ArrowUp") {
            setSelected((selected - 1 + n) % n);
            return true;
          }
          if (event.key === "Enter") {
            command(items[selected]);
            return true;
          }
          return false;
        },
      }),
      [],
    );

    if (items.length === 0) {
      return (
        <div className="w-64 rounded-md border border-olive-6 bg-olive-1 p-2 font-sans text-sm text-olive-11 shadow-md">
          No matches
        </div>
      );
    }

    return (
      <div className="w-64 overflow-hidden rounded-md border border-olive-6 bg-olive-1 p-1 font-sans shadow-md">
        {items.map((item, i) => (
          <button
            key={item.title}
            type="button"
            // Keep focus in the editor while clicking.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => command(item)}
            onMouseEnter={() => setSelected(i)}
            className={`flex w-full items-center justify-between gap-3 rounded px-2 py-1.5 text-left text-sm ${
              i === selected ? "bg-violet-3 text-violet-11" : "text-olive-12"
            }`}
          >
            <span>{item.title}</span>
            {item.hint && (
              <span className="font-mono text-xs text-olive-10">
                {item.hint}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  },
);
