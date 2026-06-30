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
  group?: string; // category header (shown when it changes down the list)
  icon?: string; // short glyph rendered in the icon tile
  desc?: string; // one-line description
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
        <div className="w-[300px] rounded-xl border border-border bg-surface p-2 font-sans text-sm text-text-muted shadow-[0_12px_40px_rgb(0_0_0/0.16)]">
          No matches
        </div>
      );
    }

    return (
      <div className="w-[300px] overflow-hidden rounded-xl border border-border bg-surface p-1.5 font-sans shadow-[0_12px_40px_rgb(0_0_0/0.16)]">
        {items.map((item, i) => {
          const newGroup = item.group && item.group !== items[i - 1]?.group;
          const on = i === selected;
          return (
            <div key={item.title}>
              {newGroup && (
                <div className="px-2.5 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-faint">
                  {item.group}
                </div>
              )}
              <button
                type="button"
                // Keep focus in the editor while clicking.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => command(item)}
                onMouseEnter={() => setSelected(i)}
                className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left ${
                  on ? "bg-action-subtle" : ""
                }`}
              >
                <span
                  className={`flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[7px] font-mono text-[11px] ${
                    on
                      ? "bg-accent-5 text-action-text"
                      : "bg-surface-raised text-text-muted"
                  }`}
                >
                  {item.icon ?? "/"}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span
                    className={`text-[13.5px] font-medium ${on ? "text-action-text" : "text-text"}`}
                  >
                    {item.title}
                  </span>
                  {(item.desc || item.hint) && (
                    <span className="truncate text-[11.5px] text-text-faint">
                      {item.desc ?? item.hint}
                    </span>
                  )}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    );
  },
);
