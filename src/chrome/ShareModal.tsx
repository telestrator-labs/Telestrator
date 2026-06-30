import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";

// Visual-only share dialog (mockup's share modal). Nothing here is wired to a
// real sharing/permissions backend — that's M7 — so every control is inert and
// submits nothing. Hand-rolled dialog (no @radix-ui/react-dialog dependency):
// Esc + backdrop close, initial focus on the close button.
export function ShareModal({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [vis, setVis] = useState<"link" | "invite">("link");

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-a8 p-6 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Share ${title}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-[min(540px,100%)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 px-[22px] pt-5 pb-1.5">
          <div>
            <div className="text-[18px] font-semibold tracking-tight text-text">
              Share “{title || "Untitled notebook"}”
            </div>
            <div className="mt-1 text-[12.5px] text-text-faint">
              Readers open a clean, interactive view — no account needed.
            </div>
          </div>
          <Button
            ref={closeRef}
            variant="secondary"
            onClick={onClose}
            aria-label="Close"
            className="h-[30px] w-[30px] flex-none p-0"
          >
            ✕
          </Button>
        </div>

        <div className="overflow-auto px-[22px] pb-1">
          <Section label="Who can open the link">
            <div className="flex gap-2.5">
              <VisOption
                on={vis === "link"}
                onClick={() => setVis("link")}
                name="Anyone with the link"
                desc="Read & interact. Opens in Reading mode."
              />
              <VisOption
                on={vis === "invite"}
                onClick={() => setVis("invite")}
                name="Only invited people"
                desc="Sign-in required to open."
              />
            </div>
          </Section>

          <Section label="Link">
            <div className="flex gap-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[9px] border border-border bg-surface-sunken px-3">
                <span className="flex-1 truncate font-mono text-[12.5px] text-text-muted">
                  telestrator.app/n/{slug(title)}
                </span>
                <span className="flex-none rounded-full border border-brand-5 bg-live-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-live-text">
                  Reads
                </span>
              </div>
              <Button variant="primary" disabled>
                Copy
              </Button>
            </div>
          </Section>

          <Section label="Embed in a page">
            <pre className="whitespace-pre-wrap break-all rounded-[9px] border border-border bg-surface-sunken px-3 py-2.5 font-mono text-[11.5px] leading-relaxed text-text-muted">
              {`<iframe src="telestrator.app/n/${slug(title)}/embed" width="100%" height="640"></iframe>`}
            </pre>
          </Section>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border-subtle bg-surface-sunken px-[22px] py-[13px]">
          <span className="flex items-center gap-1.5 text-[12px] text-text-faint">
            <span className="text-value">◆</span> Sharing is a preview — no link
            is published yet.
          </span>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border-subtle py-[15px] first:border-t-0">
      <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-faint">
        {label}
      </div>
      {children}
    </div>
  );
}

function VisOption({
  on,
  onClick,
  name,
  desc,
}: {
  on: boolean;
  onClick: () => void;
  name: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex flex-1 flex-col gap-0.5 rounded-[11px] border px-3 py-3 text-left " +
        (on
          ? "border-interactive bg-interactive-subtle shadow-[inset_0_0_0_1px_var(--color-interactive)]"
          : "border-border hover:border-border-strong")
      }
    >
      <span className="text-[13px] font-semibold text-text">{name}</span>
      <span className="text-[11.5px] leading-snug text-text-faint">{desc}</span>
    </button>
  );
}

function slug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  );
}
