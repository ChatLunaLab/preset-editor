import { useEffect, useRef } from "react";
import { basicSetup } from "codemirror";
import {
  autocompletion,
  snippetCompletion,
  type Completion,
  type CompletionContext,
} from "@codemirror/autocomplete";
import { linter, type Diagnostic } from "@codemirror/lint";
import { Compartment, EditorState } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  placeholder as codeMirrorPlaceholder,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";
import { Braces } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import {
  analyzeTemplate,
  escapeTemplateBraces,
  getTemplateDefinitions,
  type TemplateEditorContext,
} from "@/lib/prompt-template";
import { cn } from "@/lib/utils";

interface TemplateEditorProps {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  context?: TemplateEditorContext;
  placeholder?: string;
  minRows?: number;
  className?: string;
  ariaLabel?: string;
}

const templateExtension = new Compartment();
const templateTheme = new Compartment();
const editorAttributes = new Compartment();
const placeholderExtension = new Compartment();

export function TemplateEditor({
  id,
  value = "",
  onChange,
  context = "generic",
  placeholder,
  minRows = 5,
  className,
  ariaLabel = "ChatLuna 模板内容",
}: TemplateEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const theme = useTheme();

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: valueRef.current,
      extensions: [
        basicSetup,
        EditorView.lineWrapping,
        editorAttributes.of([]),
        placeholderExtension.of([]),
        templateExtension.of([]),
        templateTheme.of([]),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          const nextValue = update.state.doc.toString();
          if (nextValue === valueRef.current) return;
          valueRef.current = nextValue;
          onChangeRef.current(nextValue);
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    editorRef.current = view;

    return () => {
      view.destroy();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = editorRef.current;
    if (!view) return;
    view.dispatch({
      effects: editorAttributes.reconfigure(
        EditorView.contentAttributes.of({
          "aria-label": ariaLabel,
          ...(id ? { id } : {}),
        }),
      ),
    });
  }, [ariaLabel, id]);

  useEffect(() => {
    const view = editorRef.current;
    if (!view) return;
    view.dispatch({
      effects: placeholderExtension.reconfigure(
        placeholder ? codeMirrorPlaceholder(placeholder) : [],
      ),
    });
  }, [placeholder]);

  useEffect(() => {
    const view = editorRef.current;
    if (!view) return;
    view.dispatch({
      effects: templateExtension.reconfigure(createTemplateExtensions(context)),
    });
  }, [context]);

  useEffect(() => {
    const view = editorRef.current;
    if (!view) return;
    view.dispatch({
      effects: templateTheme.reconfigure(
        createEditorTheme(theme.resolvedTheme === "dark", minRows),
      ),
    });
  }, [minRows, theme.resolvedTheme]);

  useEffect(() => {
    const view = editorRef.current;
    if (!view || value === valueRef.current) return;

    valueRef.current = value;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
  }, [value]);

  const escapeSelection = () => {
    const view = editorRef.current;
    if (!view) return;

    const selection = view.state.selection.main;
    if (selection.empty) {
      view.dispatch({
        changes: { from: selection.from, insert: "{{}}" },
        selection: { anchor: selection.from + 2 },
      });
    } else {
      const selectedText = view.state.sliceDoc(selection.from, selection.to);
      const escaped = escapeTemplateBraces(selectedText);
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: escaped },
        selection: { anchor: selection.from + escaped.length },
      });
    }
    view.focus();
  };

  return (
    <div className={cn(className)}>
      <div className="relative">
        <div ref={containerRef} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10 size-7 bg-background/80 text-muted-foreground backdrop-blur hover:text-foreground"
          onClick={escapeSelection}
          title="转义选区中的花括号；未选择文本时插入普通花括号"
          aria-label="转义花括号"
        >
          <Braces className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function createTemplateExtensions(context: TemplateEditorContext) {
  return [
    createDecorationPlugin(context),
    autocompletion({
      override: [(completionContext) => getCompletions(completionContext, context)],
      activateOnTyping: true,
    }),
    linter((view) => createDiagnostics(view.state.doc.toString(), context), {
      delay: 200,
    }),
  ];
}

function createDecorationPlugin(context: TemplateEditorContext) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildDecorations(view.state.doc.toString(), context);
      }

      update(update: ViewUpdate) {
        if (update.docChanged) {
          this.decorations = buildDecorations(
            update.state.doc.toString(),
            context,
          );
        }
      }
    },
    { decorations: (plugin) => plugin.decorations },
  );
}

function buildDecorations(source: string, context: TemplateEditorContext) {
  const decorations = analyzeTemplate(source, context).map((range) =>
    Decoration.mark({ class: `cm-template-${range.kind}` }).range(
      range.from,
      range.to,
    ),
  );
  return Decoration.set(decorations, true);
}

function createDiagnostics(source: string, context: TemplateEditorContext) {
  return analyzeTemplate(source, context)
    .filter((range) => range.message)
    .map((range): Diagnostic => {
      const diagnostic: Diagnostic = {
        from: range.from,
        to: range.to,
        severity: range.kind === "error" ? "error" : "warning",
        message: range.message!,
      };

      if (range.kind === "unknown") {
        diagnostic.actions = [
          {
            name: "作为普通文本",
            apply(view, from, to) {
              const raw = view.state.sliceDoc(from, to);
              view.dispatch({
                changes: { from, to, insert: escapeTemplateBraces(raw) },
              });
            },
          },
        ];
      }

      return diagnostic;
    });
}

function getCompletions(
  context: CompletionContext,
  editorContext: TemplateEditorContext,
) {
  const match = context.matchBefore(/\{[A-Za-z_$]*$/);
  if (!match) return null;

  const from = match.from + 1;
  const options: Completion[] = getTemplateDefinitions(editorContext).map(
    (definition) => {
      const completion = {
        label: definition.label,
        detail: definition.detail,
        type:
          definition.type === "keyword"
            ? "keyword"
            : definition.type === "function"
              ? "function"
              : "variable",
      };

      if (definition.snippet) {
        const snippet = snippetCompletion(definition.snippet, completion);
        const applySnippet = snippet.apply;
        return {
          ...snippet,
          apply(view, selectedCompletion, applyFrom, applyTo) {
            const replaceTo = consumeClosingBrace(view, applyTo);
            if (typeof applySnippet === "function") {
              applySnippet(
                view,
                selectedCompletion,
                applyFrom,
                replaceTo,
              );
            }
          },
        };
      }

      return {
        ...completion,
        apply(view, _completion, applyFrom, applyTo) {
          view.dispatch({
            changes: {
              from: applyFrom,
              to: consumeClosingBrace(view, applyTo),
              insert: `${definition.label}}`,
            },
          });
        },
      };
    },
  );

  options.unshift({
    label: "普通花括号",
    detail: "插入不会触发模板渲染的 {{ ... }}",
    type: "text",
    boost: 100,
    apply(view, _completion, applyFrom, applyTo) {
      view.dispatch({
        changes: {
          from: applyFrom - 1,
          to: consumeClosingBrace(view, applyTo),
          insert: "{{}}",
        },
        selection: { anchor: applyFrom + 1 },
      });
    },
  });

  return { from, options, validFor: /^[A-Za-z_$]*$/ };
}

function consumeClosingBrace(view: EditorView, position: number) {
  return view.state.sliceDoc(position, position + 1) === "}"
    ? position + 1
    : position;
}

function createEditorTheme(dark: boolean, minRows: number) {
  return EditorView.theme(
    {
      "&": {
        border: "1px solid hsl(var(--input))",
        borderRadius: "var(--radius)",
        backgroundColor: dark ? "hsl(var(--input) / 0.3)" : "transparent",
        fontSize: "0.875rem",
        overflow: "hidden",
      },
      "&.cm-focused": {
        outline: "none",
        borderColor: "hsl(var(--ring))",
      },
      ".cm-scroller": {
        minHeight: `${Math.max(minRows, 3) * 1.5}rem`,
        maxHeight: "32rem",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        lineHeight: "1.5rem",
      },
      ".cm-content": {
        padding: "0.65rem 2.75rem 0.65rem 0.75rem",
        caretColor: "hsl(var(--foreground))",
      },
      ".cm-line": { padding: "0" },
      ".cm-gutters": { display: "none" },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "hsl(var(--foreground))",
      },
      ".cm-selectionBackground, ::selection": {
        backgroundColor: "hsl(var(--primary) / 0.16) !important",
      },
      ".cm-placeholder": {
        color: "hsl(var(--muted-foreground))",
      },
      ".cm-tooltip": {
        border: "1px solid hsl(var(--border))",
        borderRadius: "0.5rem",
        backgroundColor: "hsl(var(--popover))",
        color: "hsl(var(--popover-foreground))",
        overflow: "hidden",
        boxShadow: "none",
      },
      ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
        backgroundColor: "hsl(var(--accent))",
        color: "hsl(var(--accent-foreground))",
      },
      ".cm-tooltip.cm-tooltip-lint": {
        border: "none",
        borderRadius: "0",
        backgroundColor: "transparent",
        overflow: "visible",
      },
      ".cm-tooltip-lint .cm-diagnostic": {
        position: "relative",
        overflow: "hidden",
        border: "none",
        borderLeft: "none",
        borderRadius: "0.625rem",
        backgroundColor: dark
          ? "rgb(69 10 10 / 0.96)"
          : "rgb(254 242 242 / 0.98)",
        color: dark ? "#fecaca" : "#991b1b",
        padding: "0.625rem 0.875rem",
        boxShadow: "none",
      },
      ".cm-tooltip-lint .cm-diagnostic + .cm-diagnostic": {
        marginTop: "0.375rem",
      },
      ".cm-template-expression": {
        color: dark ? "#7dd3fc" : "#0369a1",
        backgroundColor: dark ? "rgb(14 116 144 / 0.2)" : "rgb(14 165 233 / 0.1)",
        borderRadius: "0.25rem",
      },
      ".cm-template-control": {
        color: dark ? "#c4b5fd" : "#6d28d9",
        backgroundColor: dark ? "rgb(109 40 217 / 0.2)" : "rgb(139 92 246 / 0.1)",
        borderRadius: "0.25rem",
      },
      ".cm-template-escaped": {
        color: dark ? "#86efac" : "#15803d",
        fontWeight: "600",
      },
      ".cm-template-unknown": {
        color: dark ? "#fcd34d" : "#a16207",
        textDecoration: "underline wavy",
        textDecorationColor: dark ? "#f59e0b" : "#ca8a04",
        textUnderlineOffset: "3px",
      },
      ".cm-template-error": {
        textDecoration: "underline dotted",
        textDecorationColor: "hsl(var(--muted-foreground))",
        textUnderlineOffset: "3px",
      },
      ".cm-diagnosticAction": {
        border: `1px solid ${dark ? "rgb(248 113 113 / 0.42)" : "rgb(220 38 38 / 0.25)"}`,
        borderRadius: "0.375rem",
        backgroundColor: dark
          ? "rgb(127 29 29 / 0.58)"
          : "rgb(255 255 255 / 0.72)",
        color: dark ? "#fee2e2" : "#991b1b",
        padding: "0.2rem 0.45rem",
        boxShadow: "none",
      },
    },
    { dark },
  );
}
