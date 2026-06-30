// A small deterministic bar motif for cards (the mockup's `.cardspark`). Heights
// are derived from a seed string so each card looks distinct but stable across
// renders — purely decorative, not real data.
export function Sparkline({
  seed,
  accent = false,
}: {
  seed: string;
  accent?: boolean;
}) {
  const bars = barsFromSeed(seed, 11);
  return (
    <div className="flex h-[104px] items-end gap-1 border-b border-border-subtle bg-gradient-to-b from-surface-sunken to-surface px-[18px] py-4">
      {bars.map((h, i) => (
        <div
          key={i}
          className={
            "min-w-0 flex-1 rounded-t-[3px] " +
            (accent && i === bars.length - 2
              ? "bg-live"
              : accent
                ? "bg-accent-6"
                : "bg-gray-6")
          }
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function barsFromSeed(seed: string, n: number): number[] {
  // Cheap, stable PRNG (mulberry32) seeded from the string's char codes.
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  const rand = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: n }, () => 30 + Math.round(rand() * 70));
}
