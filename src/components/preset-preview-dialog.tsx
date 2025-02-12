"use client";

import { useState, useEffect, useRef } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import yaml from 'js-yaml';
import { Skeleton } from "@/components/ui/skeleton";
import { RawPreset, CharacterPresetTemplate } from "@/types/preset";
import type { editor } from 'monaco-editor';
import { cn } from "@/lib/utils";
import loader from '@monaco-editor/loader';
import { useTheme } from "@/hooks/use-theme";

interface PresetPreviewDialogProps {
  preset: RawPreset | CharacterPresetTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PresetPreviewDialog({ preset, open, onOpenChange }: PresetPreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<editor.IStandaloneCodeEditor>(null);
  const resizeObserverRef = useRef<ResizeObserver>(null);
  const theme = useTheme()

  // 转换preset为YAML
  const presetYaml = yaml.dump(preset);

  // 初始化编辑器
  useEffect(() => {
    const initialize = async () => {
      try {
        const monaco = await loader.init();

        console.log("Monaco initialized:", monaco);

        // 创建编辑器实例
        editorInstanceRef.current = monaco.editor.create(
          editorContainerRef.current!,
          {
            value: presetYaml,
            language: "yaml",
            readOnly: true,
            theme: theme.resolvedTheme === "dark" ? "vs-dark" : "vs-light",
            automaticLayout: true
          }
        );

        // 响应式布局
        resizeObserverRef.current = new ResizeObserver(() => {
          editorInstanceRef.current?.layout();
        });

        if (editorContainerRef.current.parentElement) {
          resizeObserverRef.current.observe(editorContainerRef.current.parentElement);
        }

        console.log("Editor instance created:", editorInstanceRef.current);

        setIsLoading(false);


      } catch (error) {
        console.error("Monaco initialization failed:", error);
        setIsLoading(false);
      }
    };

    initialize();

  }, [open, editorContainerRef, presetYaml, theme.resolvedTheme]);

  // 更新编辑器内容
  useEffect(() => {
    if (!editorInstanceRef.current) return;

    const currentValue = editorInstanceRef.current.getValue();
    if (currentValue !== presetYaml) {
      editorInstanceRef.current.setValue(presetYaml);
    }
  }, [presetYaml, editorInstanceRef]);

  // 清理编辑器
  useEffect(() => {
    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose();
      }

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>预设预览</AlertDialogTitle>
          <AlertDialogDescription>
            以源代码形式查看预设文件。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="h-[600px]">
          {isLoading && <Skeleton className="h-full w-full rounded-xl" />}
          <div
            ref={editorContainerRef}
            className={cn("w-full h-full", isLoading ? "hidden" : "block")}
            data-testid="monaco-editor-container"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
