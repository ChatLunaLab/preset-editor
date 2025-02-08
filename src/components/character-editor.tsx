"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CharacterBasicForm } from "./character-basic-form"
import { CharacterDescriptionForm } from "./character-description-form"
import { CharacterPersonalityForm } from "./character-personality-form"
import { CharacterWorldForm } from "./character-world-form"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

export function CharacterEditor() {
  const [activeTab, setActiveTab] = useState("basic")

  const tabVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  }

  return (
    <div className="flex flex-col h-full px-6">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container">
          <div className="flex h-16 items-center">
            <Tabs defaultValue="basic" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="h-10 bg-transparent p-0">
                <TabsTrigger
                  value="basic"
                  className="rounded-md data-[state=active]:bg-muted px-3 py-1.5 text-sm font-medium transition-all"
                >
                  基本配置
                </TabsTrigger>
                <TabsTrigger
                  value="description"
                  className="rounded-md data-[state=active]:bg-muted px-3 py-1.5 text-sm font-medium transition-all"
                >
                  角色提示词
                </TabsTrigger>
                <TabsTrigger
                  value="personality"
                  className="rounded-md data-[state=active]:bg-muted px-3 py-1.5 text-sm font-medium transition-all"
                >
                  世界书
                </TabsTrigger>
                <TabsTrigger
                  value="world"
                  className="rounded-md data-[state=active]:bg-muted px-3 py-1.5 text-sm font-medium transition-all"
                >
                  作者注释
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="container py-6 max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={tabVariants}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "basic" && <CharacterBasicForm />}
              {activeTab === "description" && <CharacterDescriptionForm />}
              {activeTab === "personality" && <CharacterPersonalityForm />}
              {activeTab === "world" && <CharacterWorldForm />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

