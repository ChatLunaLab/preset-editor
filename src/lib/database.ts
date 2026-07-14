import type { UIMessage } from "ai";
import { Dexie } from "dexie";
import type { CharacterPresetTemplate, RawPreset } from "@/types/preset";

export interface PresetModel<
  T extends "main" | "character" = "main" | "character",
> {
  id: string;
  name: string;
  type: T;
  lastModified: number;
  preset: T extends "main" ? RawPreset : CharacterPresetTemplate;
}

export interface AgentChatModel {
  id: string;
  messages: UIMessage[];
  updatedAt: number;
}

export const db = new Dexie("chatluna-preset") as Dexie & {
  presets: Dexie.Table<PresetModel, string>;
  agentChats: Dexie.Table<AgentChatModel, string>;
};

db.version(1).stores({
  presets: "++id, type, lastModified, preset",
});

db.version(2).stores({
  presets: "++id, type, lastModified, preset",
  agentChats: "id, updatedAt",
});
