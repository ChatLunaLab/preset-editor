import * as React from "react";
import { cn } from "@/lib/utils";
import TextareaAutosize, { TextareaAutosizeProps } from 'react-textarea-autosize';
import { useState, useRef, useCallback } from "react";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaAutosizeProps
>(({ className, ...props }, ref) => {
    const [history, setHistory] = useState<string[]>([""]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            if (historyIndex > 0) {
                setHistoryIndex(prevIndex => prevIndex - 1);
                if (textareaRef.current) {
                    const textarea = textareaRef.current;
                    const selectionStart = textarea.selectionStart;
                    const selectionEnd = textarea.selectionEnd;
                    textarea.value = history[historyIndex - 1];
                    const event = new Event('input', { bubbles: true });
                    textarea.dispatchEvent(event);
                    textarea.selectionStart = selectionStart;
                    textarea.selectionEnd = selectionEnd;
                }
            }
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.shiftKey && e.key === 'Z')) {
            e.preventDefault();
            if (historyIndex < history.length - 1) {
                setHistoryIndex(prevIndex => prevIndex + 1);
                if (textareaRef.current) {
                    const textarea = textareaRef.current;
                    const selectionStart = textarea.selectionStart;
                    const selectionEnd = textarea.selectionEnd;
                    textarea.value = history[historyIndex + 1];
                    const event = new Event('input', { bubbles: true });
                    textarea.dispatchEvent(event);
                     textarea.selectionStart = selectionStart;
                    textarea.selectionEnd = selectionEnd;
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
        setHistory(prevHistory => {
            const newHistory = [...prevHistory.slice(0, historyIndex + 1), e.target.value];
            setHistoryIndex(newHistory.length - 1);
            return newHistory;
        });
        props.onChange?.(e);
      }}
    />
  )
})
Textarea.displayName = "Textarea";

export { Textarea };