"use client";

import { useId, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface EditorSegmentedTab {
  value: string;
  label: ReactNode;
}

interface EditorSegmentedTabsProps {
  value: string;
  items: readonly EditorSegmentedTab[];
  onValueChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}

const triggerVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

const triggerClassName =
  "px-3 py-1.5 text-sm font-medium transition-colors group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none focus-visible:border-transparent focus-visible:bg-background/60 focus-visible:ring-0 focus-visible:outline-none data-[state=active]:border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent";

export function EditorSegmentedTabs({
  value,
  items,
  onValueChange,
  ariaLabel,
  className,
}: EditorSegmentedTabsProps) {
  const layoutId = `editor-segmented-tabs-${useId()}`;

  return (
    <Tabs
      value={value}
      onValueChange={onValueChange}
      className={cn("min-w-0", className)}
    >
      <div className="w-full overflow-x-auto">
        <TabsList aria-label={ariaLabel} className="h-10 w-max max-w-none">
          {items.map((item) => (
            <motion.div
              key={item.value}
              className="h-full"
              variants={triggerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <TabsTrigger value={item.value} className={triggerClassName}>
                {value === item.value && (
                  <motion.span
                    layoutId={layoutId}
                    initial={false}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-md bg-background"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 38,
                      mass: 0.7,
                    }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </TabsTrigger>
            </motion.div>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
