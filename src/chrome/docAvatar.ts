// Per-document avatar color. A notebook's badge hue is a stable function of its
// id, so the same document always wears the same color across the sidebar rail,
// the expanded list, and the dashboard cards — a quick visual anchor.
//
// Soft Radix chips (step 3 fill / 11 text / 6 ring) rather than solid step-9, so
// every hue stays legible without per-hue text-contrast logic, reads on the
// inverse active row, and flips automatically in dark (the hues are imported
// light + dark in src/index.css). Full class strings are listed literally so
// Tailwind's JIT can see them.
const AVATAR_CLASSES = [
  "bg-[var(--indigo-3)] text-[var(--indigo-11)] ring-[var(--indigo-6)]",
  "bg-[var(--cyan-3)] text-[var(--cyan-11)] ring-[var(--cyan-6)]",
  "bg-[var(--jade-3)] text-[var(--jade-11)] ring-[var(--jade-6)]",
  "bg-[var(--amber-3)] text-[var(--amber-11)] ring-[var(--amber-6)]",
  "bg-[var(--tomato-3)] text-[var(--tomato-11)] ring-[var(--tomato-6)]",
  "bg-[var(--plum-3)] text-[var(--plum-11)] ring-[var(--plum-6)]",
] as const;

// A small, stable string hash (djb2-ish) — deterministic across reloads and
// runtimes, no crypto needed since this is purely cosmetic.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// The soft-chip color classes (bg + text + ring) for a document's avatar. Pair
// with `ring-1 ring-inset` on the element for the hairline.
export function docAvatarColor(id: string): string {
  return AVATAR_CLASSES[hash(id) % AVATAR_CLASSES.length];
}
