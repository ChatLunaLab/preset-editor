import * as React from "react";
import { cn } from "@/lib/utils";
import TextareaAutosize, { TextareaAutosizeProps } from 'react-textarea-autosize';
import { useState, useRef, useCallback, useEffect } from "react";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaAutosizeProps
>(({ className, ...props }, ref) => {
    const [history, setHistory] = useState<string[]>([""]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [savedSelection, setSavedSelection] = useState<{ start: number; end: number } | null>(null);

    useEffect(() => {
        if (savedSelection && textareaRef.current) {
            const { start, end } = savedSelection;
            textareaRef.current.selectionStart = start;
            textareaRef.current.selectionEnd = end;
            setSavedSelection(null);
        }
    }, [savedSelection, historyIndex]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            if (historyIndex > 0) {
                const textarea = textareaRef.current;
                if (textarea) {
                    setSavedSelection({
                        start: textarea.selectionStart,
                        end: textarea.selectionEnd
                    });
                    setHistoryIndex(prevIndex => prevIndex - 1);
                }
            }
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.shiftKey && e.key === 'Z')) {
            e.preventDefault();
            if (historyIndex < history.length - 1) {
                const textarea = textareaRef.current;
                if (textarea) {
                    setSavedSelection({
                        start: textarea.selectionStart,
                        end: textarea.selectionEnd
                    });
                    setHistoryIndex(prevIndex => prevIndex + 1);
                }
            }
        }
    }, [history, historyIndex]);

    return (
        <TextareaAutosize
            className={cn(
                "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                className
            )}
            {...props}
            value={history[historyIndex]}
            ref={(el) => {
                if (ref) {
                    if (typeof ref === 'function') {
                        ref(el);
                    } else {
                        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
                    }
                }
                textareaRef.current = el;
            }}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
                const newValue = e.target.value;
                setHistory(prevHistory => {
                    const newHistory = [...prevHistory.slice(0, historyIndex + 1), newValue];
                    return newHistory;
                });
                setHistoryIndex(prevIndex => prevIndex + 1);
                props.onChange?.(e);
            }}
        />
    );
});
Textarea.displayName = "Textarea";

export { Textarea };