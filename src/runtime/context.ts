import { reactive, toRaw } from "@vue/reactivity";
import type { Context } from "./types";

// The shared `$` is a Vue reactive object: reading `$.x` inside a running cell
// registers a dependency, and writing `$.x` from another cell re-runs the
// readers. We chose @vue/reactivity for transparent deep `$.x` tracking (like
// MobX) at ~⅓ the size, with `effectScope` + per-run cleanup.
export function createContext(initial: Context = {}): Context {
  return reactive(initial);
}

// A plain (non-reactive) snapshot of the given keys, for display/inspection
// without registering reactive reads.
export function snapshot(
  $: Context,
  keys: Iterable<string>,
): Record<string, unknown> {
  const raw = toRaw($);
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k] = raw[k];
  return out;
}

// Remove every own key from the context (used by restart) without replacing the
// object identity, so existing reactive bindings keep working.
export function clearContext($: Context): void {
  for (const k of Object.keys($)) delete $[k];
}
