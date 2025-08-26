import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import {
    autocompletion,
    CompletionContext,
    CompletionResult,
} from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';

interface EnhancedTextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    variables?: Record<string, string>;
    rows?: number;
}

const EnhancedTextarea = React.forwardRef<
    HTMLDivElement,
    EnhancedTextareaProps
>(({ className, variables = {}, value, onChange, rows = 5, ...props }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const editorViewRef = useRef<EditorView | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    // 创建变量补全函数
    const createVariableCompletions = (
        context: CompletionContext
    ): CompletionResult | null => {
        const word = context.matchBefore(/{\w*/);
        if (!word || (word.from === word.to && !context.explicit)) return null;

        if (word.text === '{' || word.text.startsWith('{')) {
            return {
                from: word.from + 1, // 从 { 后面开始
                options: Object.keys(variables).map((key) => ({
                    label: key,
                    type: 'variable',
                    apply: key + '}', // 自动添加结束括号
                })),
            };
        }

        return null;
    };

    // 创建花括号高亮扩展
    const createBraceHighlightExtension = () => {
        const bracketHighlighter = EditorView.decorations.compute(
            ['doc'],
            (state) => {
                const decorations = [];
                if (!state || !state.doc) return EditorView.decorations.empty;
                
                try {
                    const text = state.doc.toString();
                    const regex = /\{([^{}]*)\}/g;
                    let match;

                    while ((match = regex.exec(text)) !== null) {
                        const start = match.index;
                        const end = start + match[0].length;
                        
                        // Ensure we have valid positions
                        if (start >= 0 && end > start) {
                            decorations.push({
                                from: start,
                                to: end,
                                value: EditorView.mark({
                                    class: 'cm-variable-highlight',
                                }),
                            });
                        }
                    }
                    
                    return decorations.length ? EditorView.decorations.of(decorations) : EditorView.decorations.empty;
                } catch (error) {
                    console.error('Error in highlight extension:', error);
                    return EditorView.decorations.empty;
                }
            }
        );

        return bracketHighlighter;
    };

    useEffect(() => {
        if (!editorRef.current || editorViewRef.current) return;

        try {
            const theme = new Compartment();
            const language = new Compartment();

            // 创建编辑器状态
            const state = EditorState.create({
                doc: (value as string) || '',
                extensions: [
                    basicSetup,
                    language.of(javascript()),
                    theme.of(oneDark),
                    autocompletion({ override: [createVariableCompletions] }),
                    keymap.of([indentWithTab]),
                    createBraceHighlightExtension(),
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged && onChange) {
                            const newValue = update.state.doc.toString();
                            const event = {
                                target: { value: newValue },
                            } as React.ChangeEvent<HTMLTextAreaElement>;
                            onChange(event);
                        }
                    }),
                    EditorView.theme({
                        '&': {
                            height: rows ? `${rows * 1.5}em` : 'auto',
                            minHeight: '60px',
                        },
                        '.cm-scroller': {
                            fontFamily: 'inherit',
                            lineHeight: '1.5',
                        },
                        '.cm-content': {
                            caretColor: 'var(--foreground)',
                        },
                        '.cm-variable-highlight': {
                            backgroundColor: 'rgba(var(--primary), 0.2)',
                            color: 'rgb(var(--primary))',
                            borderRadius: '0.25rem',
                            padding: '0 0.125rem',
                        },
                    }),
                ],
            });

            // 创建编辑器视图
            const view = new EditorView({
                state,
                parent: editorRef.current,
            });

            editorViewRef.current = view;

            return () => {
                if (editorViewRef.current) {
                    editorViewRef.current.destroy();
                    editorViewRef.current = null;
                }
            };
        } catch (error) {
            console.error('Error initializing CodeMirror editor:', error);
            return () => {};
        }
    }, [rows, value, variables]);

    // 当值从外部更新时更新编辑器内容
    useEffect(() => {
        const view = editorViewRef.current;
        if (!view) return;

        try {
            const currentValue = view.state.doc.toString();
            if (value !== undefined && value !== currentValue) {
                view.dispatch({
                    changes: {
                        from: 0,
                        to: currentValue.length,
                        insert: (value as string) || '',
                    },
                });
            }
        } catch (error) {
            console.error('Error updating editor content:', error);
        }
    }, [value]);

    return (
        <div
            ref={ref}
            className={cn(
                'relative rounded-md border border-input shadow-sm',
                isFocused && 'ring-1 ring-ring',
                className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
        >
            <div
                ref={editorRef}
                className="min-h-[60px] w-full rounded-md bg-transparent px-3 py-2 text-base md:text-sm"
            />
        </div>
    );
});

EnhancedTextarea.displayName = 'EnhancedTextarea';

export { EnhancedTextarea };
