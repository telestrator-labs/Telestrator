// Grading + `$`-binding helpers for the knowledge-check node — pure functions,
// mirroring binding.ts. A check grades the reader's answer in React (synchronous
// feedback); a *named* check also publishes its result to `$` through the same
// rt.update pipeline an input cell uses, so a later cell can total the score.

export type AnswerKind = "choice" | "number" | "text";

// Per-kind authoring config, persisted as JSON in `data-config`.
export interface KnowledgeCheckConfig {
  // choice
  options?: string[];
  // Raw comma-separated author text (source of truth so separators survive
  // keystrokes); `options` is the parsed array used by the control + grading.
  optionsText?: string;
  correctChoice?: number; // index into options
  // number
  correctNumber?: number;
  tolerance?: number; // allowed ± distance (default 0 = exact)
  // text
  correctText?: string;
  caseSensitive?: boolean;
  // feedback
  hint?: string; // offered on request
  explanation?: string; // shown when right
  // pedagogy (1c flow)
  attempts?: number; // tries before the answer locks (default 2)
  reveal?: boolean; // offer "Reveal answer" (default true)
}

export interface Grade {
  answered: boolean;
  correct: boolean;
}

// Grade the reader's `value` against the authored config. "Unanswered" (empty /
// no selection) is neutral — never marked wrong.
export function gradeAnswer(
  kind: AnswerKind,
  value: unknown,
  config: KnowledgeCheckConfig,
): Grade {
  switch (kind) {
    case "choice": {
      const options = config.options ?? [];
      const answered = typeof value === "string" && options.includes(value);
      const correct = answered && value === options[config.correctChoice ?? -1];
      return { answered, correct };
    }
    case "number": {
      const s = value == null ? "" : String(value).trim();
      const n = Number(s);
      const answered = s !== "" && Number.isFinite(n);
      const target = config.correctNumber;
      const correct =
        answered &&
        typeof target === "number" &&
        Number.isFinite(target) &&
        Math.abs(n - target) <= (config.tolerance ?? 0);
      return { answered, correct };
    }
    case "text":
    default: {
      const raw = value == null ? "" : String(value);
      const answered = raw.trim() !== "";
      const norm = (s: string) =>
        config.caseSensitive ? s.trim() : s.trim().toLowerCase();
      const correct = answered && norm(raw) === norm(config.correctText ?? "");
      return { answered, correct };
    }
  }
}

// The generated source for a *named* check: publishes whether the reader has
// passed it to `$`, so other cells can react (progress/scoring). A pass is
// "checked and correct". Baked in (already computed in React), exactly as
// binding.ts bakes an input's value.
export function bindingCode(name: string, passed: boolean): string {
  return `$[${JSON.stringify(name)}] = ${passed};`;
}
