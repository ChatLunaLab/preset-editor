export interface RawPreset {
    keywords: string[];
    prompts: BaseMessage[];
    format_user_prompt?: string;
    world_lores?: (WorldLoreConfig | RawWorldLore)[];
    version?: string;
    authors_note?: AuthorsNote;
    knowledge?: KnowledgeConfig;
    config?: {
        longMemoryPrompt?: string;
        loreBooksPrompt?: string;
        longMemoryExtractPrompt?: string;
        longMemoryNewQuestionPrompt?: string;
        postHandler?: PostHandler;
    };
}

export interface RawWorldLore {
    keywords: string | (string | RegExp)[];
    content: string;
    insertPosition?:
        | "before_char_defs"
        | "after_char_defs"
        | "before_scenario"
        | "after_scenario"
        | "before_example_messages"
        | "after_example_messages";
    scanDepth?: number;
    recursiveScan?: boolean;
    maxRecursionDepth?: number;
    matchWholeWord?: boolean;
    constant?: boolean;
    caseSensitive?: boolean;
    enabled?: boolean;
    order?: number;
    tokenLimit?: number;
}

export interface WorldLoreConfig extends RawWorldLore {
    scanDepth?: number;
    tokenLimit?: number;
    recursiveScan?: boolean;
    maxRecursionDepth?: number;
    insertPosition?:
        | "before_char_defs"
        | "after_char_defs"
        | "before_scenario"
        | "after_scenario"
        | "before_example_messages"
        | "after_example_messages";
}

export function isWorldLoreConfig(obj: RawWorldLore | WorldLoreConfig): obj is WorldLoreConfig {
    return !isWorldLore(obj) && typeof obj === "object" && obj !== null;
}

export function isWorldLore(obj: RawWorldLore | WorldLoreConfig): obj is RawWorldLore {
    return (
        typeof obj === "object" &&
        obj !== null &&
        "keywords" in obj &&
        "content" in obj
    );
}

export interface BaseMessage {
    role: "user" | "system" | "assistant";
    type?: "personality" | "description" | "first_message" | "scenario";
    content: string;
}

export interface PostHandler {
    prefix: string;
    postfix: string;
    censor?: boolean;
    variables: Record<string, string>;
}

export interface KnowledgeConfig {
    knowledge: string[] | string;
    prompt?: string;
}

export interface AuthorsNote {
    content: string;
    insertPosition?: "after_char_defs" | "in_chat";
    insertDepth?: number;
    insertFrequency?: number;
}

export function isRawPreset(obj: unknown): obj is RawPreset {
    return (
        typeof obj === "object" &&
        obj!== null &&
        "keywords" in obj &&
        "prompts" in obj
    );
}

export function isCharacterPresetTemplate(obj: unknown): obj is CharacterPresetTemplate {
    return (
        typeof obj === "object" &&
        obj!== null &&
        "name" in obj &&
        "nick_name" in obj &&
        "input" in obj &&
        "system" in obj
    );
}

export interface CharacterPresetTemplate {
    name: string;
    status?: string;
    nick_name: string[];
    input: string;
    system: string;
    mute_keyword?: string[];
    path?: string;
    bot_id?: string;
    owner_id?: string;
    description?: string;
    personality?: string;
    hobbies?: string;
    dialogue_examples?: string;
    chat_style?: string;
    chat_behavior?: string;
    relationship?: string;
    stickers?: string;
}
