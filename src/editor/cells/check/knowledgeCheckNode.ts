import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { KnowledgeCheckView } from "@/editor/cells/check/KnowledgeCheckView";
import type {
  AnswerKind,
  KnowledgeCheckConfig,
} from "@/editor/cells/check/knowledgeCheck";

// A knowledge-check block: a graded question authored inline. A block-level atom
// like inputCell — but instead of a `$`-knob it holds a question + expected
// answer + feedback. The NodeView grades the reader's answer live, and (when the
// author gives it a `$` key) publishes its correctness to `$` for progress.
export const KNOWLEDGE_CHECK_NODE = "knowledgeCheck";

export interface KnowledgeCheckAttributes {
  id: string | null;
  name: string;
  question: string;
  answerKind: AnswerKind;
  value: unknown;
  config: KnowledgeCheckConfig;
}

// JSON attrs round-trip through ProseMirror/Yjs and the HTML clipboard via
// `data-*`; parse defensively.
function parseJSON<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const KnowledgeCheck = Node.create({
  name: KNOWLEDGE_CHECK_NODE,
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attrs) => (attrs.id ? { "data-id": attrs.id } : {}),
      },
      // Optional `$` key. Empty = self-contained (no runtime registration).
      name: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-name") ?? "",
        renderHTML: (attrs) => ({ "data-name": attrs.name }),
      },
      // JSON-encoded so arbitrary question text (quotes/newlines) survives.
      question: {
        default: "",
        parseHTML: (element) =>
          parseJSON(element.getAttribute("data-question"), ""),
        renderHTML: (attrs) => ({
          "data-question": JSON.stringify(attrs.question),
        }),
      },
      answerKind: {
        default: "choice",
        parseHTML: (element) =>
          (element.getAttribute("data-answer-kind") as AnswerKind) ?? "choice",
        renderHTML: (attrs) => ({ "data-answer-kind": attrs.answerKind }),
      },
      value: {
        default: "",
        parseHTML: (element) =>
          parseJSON(element.getAttribute("data-value"), ""),
        renderHTML: (attrs) => ({ "data-value": JSON.stringify(attrs.value) }),
      },
      config: {
        default: {} as KnowledgeCheckConfig,
        parseHTML: (element) =>
          parseJSON<KnowledgeCheckConfig>(
            element.getAttribute("data-config"),
            {},
          ),
        renderHTML: (attrs) => ({
          "data-config": JSON.stringify(attrs.config),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-knowledge-check]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-knowledge-check": "" }, HTMLAttributes),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(KnowledgeCheckView);
  },
});
