import { cx } from "../ui/cx";
import { docAvatarColor } from "./docAvatar";

// A document's colored avatar: its 2-letter abbreviation on a soft chip whose
// hue is a stable function of the id (see docAvatarColor). Shared by the sidebar
// rail/list and the dashboard cards so a notebook keeps one identity color.

// Initials of the first two words, else the first two letters of the title.
function abbreviate(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length >= 2
      ? words[0][0] + words[1][0]
      : (words[0] ?? "").slice(0, 2);
  return letters.toUpperCase() || "··";
}

export function DocBadge({
  id,
  title,
  className,
}: {
  id: string;
  title: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "flex size-5 flex-none items-center justify-center rounded-[5px] text-[9.5px] font-semibold leading-none ring-1 ring-inset",
        docAvatarColor(id),
        className,
      )}
    >
      {abbreviate(title)}
    </span>
  );
}
