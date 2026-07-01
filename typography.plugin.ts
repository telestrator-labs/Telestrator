import { type Config } from "tailwindcss";

// Custom `prose` styling for the notebook document, adapted from the Tailwind
// Labs typography config (.docs/temp/typography.ts) to the "Ink & Signal" design
// system: serif body, sans headings, and our semantic tokens. Loaded via
// `@config` in src/index.css; the @tailwindcss/typography plugin is registered
// there with `@plugin`. The `invert` block is the dark-mode hook for later.
//
// Note: the gold "signal" scheme is reserved for live `$`-value chips (the
// `.value-ref` spans). Plain inline `code` is static text, so it wears a neutral
// muted scheme — a quiet gray pill — to keep gold meaningful.
export default {
  theme: {
    extend: {
      typography: {
        invert: {
          css: {
            "--tw-prose-body": "var(--color-text)",
            "--tw-prose-headings": "var(--color-text)",
            "--tw-prose-links": "var(--color-action-text)",
            "--tw-prose-bold": "var(--color-text)",
            "--tw-prose-counters": "var(--color-text-muted)",
            "--tw-prose-bullets": "var(--color-text-faint)",
            "--tw-prose-hr": "var(--color-border-subtle)",
            "--tw-prose-quotes": "var(--color-text-muted)",
            "--tw-prose-quote-borders": "var(--color-action-border)",
            "--tw-prose-code": "var(--color-accent-11)",
          },
        },
        DEFAULT: {
          css: {
            // Roles → semantic tokens (so dark mode is a token flip later).
            "--tw-prose-body": "var(--color-text-muted)",
            "--tw-prose-headings": "var(--color-text)",
            "--tw-prose-links": "var(--color-action-text)",
            "--tw-prose-bold": "var(--color-text)",
            "--tw-prose-counters": "var(--color-text-muted)",
            "--tw-prose-bullets": "var(--color-text-faint)",
            "--tw-prose-hr": "var(--color-border-subtle)",
            "--tw-prose-quotes": "var(--color-text-muted)",
            "--tw-prose-quote-borders": "var(--color-action-border)",
            "--tw-prose-code": "var(--color-accent-11)",

            // Base — serif manuscript body.
            color: "var(--tw-prose-body)",
            fontFamily: "var(--font-serif)",
            fontSize: "18px",
            lineHeight: "1.72",
            textWrap: "pretty",
            maxWidth: "none",
            "> * + *": { marginTop: "0.8em" },
            p: { marginTop: "0", marginBottom: "0.8em" },

            // Headings — sans, tight.
            "h1, h2, h3": {
              fontFamily: "var(--font-serif)",
              color: "var(--tw-prose-headings)",
              fontWeight: "600",
              letterSpacing: "-0.02em",
            },
            h1: {
              fontSize: "1.7em",
              lineHeight: "1.1",
              marginTop: "0",
              marginBottom: "0.3em",
            },
            h2: {
              fontSize: "1.35em",
              marginTop: "1.4em",
              marginBottom: "0.4em",
            },
            h3: {
              fontSize: "1.1em",
              marginTop: "1.2em",
              marginBottom: "0.3em",
            },
            ":is(h1, h2, h3) + *": { marginTop: "0" },

            a: {
              color: "var(--tw-prose-links)",
              fontWeight: "500",
              textDecoration: "underline",
            },
            strong: { color: "var(--tw-prose-bold)", fontWeight: "600" },

            // Inline code — accent (violet) text on a raised neutral pill. The
            // pill is `surface-active` (a step above `--paper`, which is now
            // gray-2 / black-a12, not white) so it stays legible on the document
            // surface. Code that references a reactive `$` value is re-tinted gold
            // by the CodeSignal decoration (`.code--signal`, styled in
            // editor/app.css), keeping gold reserved for reactive variables.
            code: {
              color: "var(--color-accent-11)",
              backgroundColor: "var(--color-surface-active)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.85em",
              fontWeight: "500",
              borderRadius: "4px",
              padding: "0.15em 0.35em",
            },
            "code::before": { content: '""' },
            "code::after": { content: '""' },

            blockquote: {
              fontStyle: "italic",
              color: "var(--tw-prose-quotes)",
              borderLeftWidth: "3px",
              borderLeftColor: "var(--tw-prose-quote-borders)",
              paddingLeft: "1rem",
            },
            hr: {
              borderColor: "var(--tw-prose-hr)",
              marginTop: "1.6em",
              marginBottom: "1.6em",
            },
            "ul, ol": { paddingLeft: "1.4em" },
            "ul > li::marker": { color: "var(--tw-prose-bullets)" },
            "ol > li::marker": { color: "var(--tw-prose-counters)" },
          },
        },
      },
    },
  },
} satisfies Config;
