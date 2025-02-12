"use client"

import React from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, Pencil } from "lucide-react"
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { downloadPreset, useSquarePresetForNetwork } from "@/hooks/use-square-presets"
import { SquarePresetData } from "@/types/square"
import { CharacterPresetTemplate, isCharacterPresetTemplate, isRawPreset, RawPreset } from "@/types/preset"
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ChevronDown } from "lucide-react";
import { Skeleton } from './ui/skeleton';

interface PresetDetailsProps {
  squarePreset: SquarePresetData
}


export function PresetDetails({ squarePreset }: PresetDetailsProps) {
  const navigate = useNavigate();

  const preset = useSquarePresetForNetwork(squarePreset)


  return (
    <div className="container py-6 px-6 sm:px-12">
      <div className="mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-2" />
        </Button>
      </div>
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1 flex-1">
          <h1 className="text-2xl font-bold">{squarePreset.keywords?.[0] ?? squarePreset.name}</h1>
          <div className="mt-4 flex items-center gap-2 text-muted-foreground">

            <Badge variant="secondary">
              {squarePreset.type === 'main' ? "主插件预设" : "伪装预设"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            预览
          </Button>
          <Button variant="outline" onClick={() => downloadPreset(squarePreset)} size="sm">
            <Download className="h-4 w-4 mr-2" />
            下载
          </Button>
          <Button size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            编辑
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {!preset && <Loading />}
      {preset && isRawPreset(preset) && MainPresetDetails(preset)}

      {preset && isCharacterPresetTemplate(preset) && CharacterPresetDetails(preset)}
    </div>
  )
}

export function MainPresetDetails(preset: RawPreset) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem label="名称" value={preset.keywords.join(", ")} />
              <DetailItem label="格式化用户输入" value={preset.format_user_prompt ?? "空"} />
            </div>
          </div>
        </CardContent>
      </Card>

      <PresetMessages preset={preset} />
    </div>
  )
}

export function CharacterPresetDetails(preset: CharacterPresetTemplate) {
  console.log(preset.input)
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem label="名称" value={preset.name} />
              <DetailItem label="触发关键词" value={preset.nick_name.join(", ") ?? "空"} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem label="禁言关键词" value={preset.mute_keyword.join(", ")} />
              <DetailItem label="状态" value={preset.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-6">
          <CardTitle>角色提示词</CardTitle>

        </CardHeader>


        <CardContent className="space-y-4 p-6 pt-0">
          <div className="space-y-1">
            <p className="font-medium">系统提示词</p>
            <p className="text-sm whitespace-pre-wrap">{preset.system}</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">输入提示词</p>
            <p className="text-sm whitespace-pre-wrap">{preset.input}</p>
          </div>

        </CardContent>


      </Card>
    </div>
  )
}


export function Loading() {
  return (
    <div>
      <Skeleton className="h-70 w-full rounded-xl" />
      <div className="space-y-2 mt-10">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  )
}

interface PresetMessagesProps {
  preset: RawPreset;
}

function PresetMessages({ preset }: PresetMessagesProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [open, setOpen] = React.useState(true)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-6">
        <CardTitle>角色提示词</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="h-8 w-8 p-0">
          <ChevronDown className={cn("h-4 w-4", open ? "rotate-180" : "")} />
        </Button>
      </CardHeader>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200",
          open
            ? "grid-rows-[1fr]"
            : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">

          <CardContent className="space-y-4 p-6 pt-0">
            {preset.prompts.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-4 items-start w-full",
                  isMobile ? "flex-col" : ""
                )}
              >
                <div className={`space-y-2  overflow-x-visible  ${isMobile ? 'w-full' : 'w-30'}`}>
                  <p>提示词类型</p>
                  <div className='overflow-x-visible prompt-type'>{message.role}</div>
                </div>
                <div className="space-y-2 flex-grow w-full">
                  <p>提示词内容</p>
                  <p className='whitespace-pre-wrap'>{message.content.length < 1 ? "空内容" : message.content}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </div>
      </div>


    </Card>
  );
}

interface DetailItemProps {
  label: string
  value: string
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  )
}
