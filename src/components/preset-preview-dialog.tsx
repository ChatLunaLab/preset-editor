"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import yaml from 'js-yaml';
import { Skeleton } from "@/components/ui/skeleton";
import { RawPreset, CharacterPresetTemplate } from "@/types/preset";
import type { editor } from 'monaco-editor';
import { cn } from "@/lib/utils";
import loader from '@monaco-editor/loader';
import { useTheme } from "@/hooks/use-theme";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "./ui/button";

interface PresetPreviewDialogProps {
  preset: RawPreset | CharacterPresetTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PresetPreviewDialog({ preset, open, onOpenChange }: PresetPreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<editor.IStandaloneCodeEditor>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver>(null);
  const theme = useTheme()
  const isMobile = useMediaQuery('(max-width: 768px)');

  // 转换preset为YAML
  const presetYaml = yaml.dump(preset);

  // 初始化编辑器
  useEffect(() => {
    const initialize = async () => {
      try {
        const monaco = await loader.init();

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
          const dialogContentRect = dialogContentRef.current?.getBoundingClientRect();

          if (isMobile) {
            editorInstanceRef.current?.layout({
              width: (dialogContentRect?.width || 0) * 0.9,
              height: (dialogContentRect?.height || 0) * 0.8,
            })
          } else {
            editorInstanceRef.current?.layout()
          }
        });

        if (editorContainerRef.current.parentElement) {
          resizeObserverRef.current.observe(editorContainerRef.current.parentElement);
        }

        if (dialogContentRef.current) {
          resizeObserverRef.current.observe(dialogContentRef.current);

          if (isMobile) {
            const dialogContentRect = dialogContentRef.current?.getBoundingClientRect();

            editorInstanceRef.current?.layout({
              width: (dialogContentRect?.width || 0) * 0.9,
              height: (dialogContentRect?.height || 0) * 0.8,
            })
          } else {
            editorInstanceRef.current?.layout() 
          }
        }

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={dialogContentRef} className={cn("max-w-4xl rounded-lg", isMobile ? "max-w-[90vw] max-h-[90%]" : "max-w-[400px] sm:max-w-[800px]")}>
        <DialogHeader>
          <DialogTitle>预设预览</DialogTitle>
          <DialogDescription>
            以源代码形式查看预设文件。
          </DialogDescription>
        </DialogHeader>
        <div className="h-[600px]">
          {isLoading && <Skeleton className="h-full w-full rounded-xl" />}
          <div
            ref={editorContainerRef}
            className={cn("w-full h-full", isLoading ? "hidden" : "block")}
            data-testid="monaco-editor-container"
          />
        </div>
        <DialogFooter>
          <Button onClick={()=>onOpenChange(false)} >取消</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
