import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useValue } from "./RuntimeProvider";
import { useTrace, usePulse } from "./TraceContext";
import { cx } from "../ui/cx";

// The NodeView for an inline `$`-value reference — a gold chip in the prose that
// shows the key and its *current* value, updating live as inputs change, and
// drawing the trace on hover (lighting the cells the value drives). The live
// value comes from useValue (writer → output); hovering calls the shared trace
// scope, gated by the "Show on hover" setting exactly like a cell.
export function ValueRefView({ node }: NodeViewProps) {
  const name = (node.attrs.name as string) ?? "";
  const value = useValue(name);
  const trace = useTrace();
  const rippling = usePulse(value, true);

  const formatted = formatInline(value);

  return (
    <NodeViewWrapper
      as="span"
      data-value-ref-name={name || undefined}
      className={cx("value-ref", rippling && "value-ref--ripple")}
      contentEditable={false}
      onMouseEnter={() => name && trace.hoverValue(name)}
      onMouseLeave={() => trace.clearHover()}
    >
      <span className="value-ref__key">${name ? `.${name}` : ""}</span>
      {formatted !== null && (
        <span className="value-ref__val">{formatted}</span>
      )}
    </NodeViewWrapper>
  );
}

// Compact one-line rendering for an inline chip: numbers/booleans as-is, strings
// quoted, arrays/objects collapsed to a glyph, undefined omitted (nothing has
// written the key yet).
function formatInline(v: unknown): string | null {
  if (v === undefined) return null;
  if (v === null) return "null";
  switch (typeof v) {
    case "number":
    case "boolean":
      return String(v);
    case "string":
      return JSON.stringify(v);
    default:
      return Array.isArray(v) ? "[…]" : "{…}";
  }
}
