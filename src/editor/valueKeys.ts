// A tiny module-level registry of the notebook's live `$` keys and their current
// values. The `$`-autocomplete popup renders in a detached ReactRenderer root
// (outside the provider tree), so it can't read the runtime via React context —
// it reads this instead. RuntimeProvider keeps it in sync as the graph changes.

export interface ValueEntry {
  key: string;
  value: unknown;
}

let entries: ValueEntry[] = [];
const subs = new Set<() => void>();

export function setValueEntries(next: ValueEntry[]): void {
  entries = next;
  subs.forEach((cb) => cb());
}

export function getValueEntries(): ValueEntry[] {
  return entries;
}

export function subscribeValueKeys(cb: () => void): () => void {
  subs.add(cb);
  return () => subs.delete(cb);
}
