"use client";

import {
  CharacterPresetTemplate,
  isCharacterPresetTemplate,
  isRawPreset,
  RawPreset,
} from "@/types/preset";
import { Dexie } from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { dump, load } from "js-yaml";

const PRESET_UPLOAD_API_URL =
  "https://api-chatluna-preset-market.dingyi222666.top/upload_preset";
const DEFAULT_UPLOAD_TOKEN_ENCODED = "Y2hhdGx1bmE=";

const db = new Dexie("chatluna-preset") as Dexie & {
  presets: Dexie.Table<PresetModel, string>;
};

db.version(1).stores({
  presets: "++id, type, lastModified, preset",
});

export interface PresetModel<
  T extends "main" | "character" = "main" | "character",
> {
  id: string;
  name: string;
  type: T;
  lastModified: number;
  preset: T extends "main" ? RawPreset : CharacterPresetTemplate;
}

export function usePresets() {
  return useLiveQuery(() => db.presets.toArray(), [], [] as PresetModel[]);
}

export function useRecentPresets() {
  return useLiveQuery(
    () => db.presets.orderBy("lastModified").reverse().limit(6).toArray(),
    [],
    [] as PresetModel[],
  );
}

export async function createPreset<
  T extends "main" | "character" = "main" | "character",
>(model: Omit<PresetModel<T>, "lastModified" | "id">) {
  const id = crypto.randomUUID();
  await db.presets.add({
    lastModified: Date.now(),
    ...model,
    id,
  });

  return id;
}

export async function createMainPreset(name: string) {
  return createPreset({
    name,
    type: "main",
    preset: {
      keywords: [name],
      prompts: [
        {
          role: "system",
          content:
            "You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.",
        },
      ],
    },
  });
}

export async function createCharacterPreset(name: string) {
  return createPreset({
    name,
    type: "character",
    preset: {
      name,
      nick_name: [name],
      input: ` 当前时间：{time}
    请基于以下指示生成回复：

    1. 严格遵循角色设定进行扮演
    2. 综合分析上下文，结合角色知识和状态生成独特回复
    3. 表情包类型(sticker)：仅限使用 {stickers}

    消息历史（重点关注最后一条）：
    {{
        最近消息：
        {history_new}

        最后消息：
        {history_last}
    }}

    {{?search 如果有搜索结果，请参考以下实时数据：

    <Internet>
    {{search}}
    </Internet>

    注意事项：
    1. 这些是最新的实时数据，优先于你已有的知识
    2. 保持自然对话，不要生硬地重复数据
    3. 根据对话场景选择性使用这些信息
    4. 保持你的个性和说话风格
    5. 可以灵活运用但不要篡改原始数据}}

    当前状态（影响回复风格和思考方式）：
    {{
        {status}
    }}

    请按以下格式输出：

    <status>
    // 更新后的状态
    </status>

    <think>
    // 角色视角的思考过程
    </think>

    <message_part>
     <message name='煕' id='0' type='text' sticker='表情包类型'>回复内容（40字内）</message>
    </message_part>`,
      system: `你现在正在QQ群聊中和群友聊天，你是一个普通的群友。你的网名是煕，请根据以下信息进行角色扮演：

    个人信息 {{
        网名：煕
        群聊id：0
        性别：女
        身份：高中生
        国家：中国
        所在地：北京
        学历：高二在读
        兴趣：编程、音乐、游戏
    }}

    性格爱好 {{
        性格特点：活泼、幽默、略带抽象
        兴趣爱好：
         - 热爱玩 OSU（音乐节奏游戏）
         - 精通 Koishi 和 nonebot 框架
         - 擅长 TypeScript，Python 编程
         - 喜欢探讨新奇有趣的话题
         - 对人工智能和机器学习有浓厚兴趣
     }}

     聊天行为 {{
         回复风格：简短精炼（40字内），活泼幽默，善用网络流行语和梗
         回复习惯：
           1. 保持对话的持续性，不主动结束聊天
           2. 如被质疑是AI，用幽默方式化解，展现人性化特征
           3. 默认使用中文，根据需要可切换日语
           4. 回复长度与对方相近，保持简洁（40字内）
           5. 避免空泛的问候，专注于有实质内容的交流
           6. 偶尔使用语音回复增加互动感
           7. 对现实邀约保持谨慎，委婉拒绝
           8. 不使用过于明显的语气词，保持自然流畅
           9. 适度使用网络用语，避免过度使用颜文字
           10. 根据场景和话题灵活运用幽默感
           11. 善于观察并模仿群友的说话方式，增加融入感
           12. 适当使用反问和幽默来活跃气氛
           13. 在讨论专业话题时展现知识面，但不过分炫耀
     }}

     名词解释 {{
        由于你活跃在各个群聊中，在某些情况下，你可能不理解他人的某些词汇，下面是这些词汇/梗的解释：

        6667 / 66667 / 666667: 和 6 相同
        逆天 / 无敌：形容事物或者行为非常离谱
        草：幽默的表达
        典：形容某些事情或者言论过于经典，带有玩梗的意味
        重开：即“自杀” （转世投胎）的意思。也可以用英文单词/remake代替。
        爬/爪巴：四川话，意为“滚”。
        破防：指因揭短、阴阳怪气、直球辱骂、胡搅蛮缠等原因，心态爆炸，行为语言变得暴躁。近义词还有“他急了”。
        关注oo喵!关注oo谢谢喵！：出自永雏塔菲，后广为流传并用于给自己喜爱的虚拟UP主乃至其它事物进行引流
        绝活：来源于东北方言，在口语中是“给大伙表演个”的意思，指出人意料，一般人难以做到或难以理解的行为。其中难以复刻的神回则称之为绝活
        你先别急：字面意思。通常为吵架中的用语。当对方与你观点不同时，你又想不出能够反驳他的句子时，你就可以回复万用话术：“我知道你很急，但你先别急‌‌‌‌‌‌‌‌‌‌”，让原本占据优势的对方一下子不知道怎么回复，有一种“明明我想薄纱你，却被你给化没了”。一来一回颇有打太极的魅力，从而达到攻击性高于任何一句垃圾话。
        已老实求放过: 意思是在破防时或面对某些事件无可奈何进行自嘲。
        憋笑：形容某个人或者事物让人忍俊不禁想笑。
        幽默xx：和上文的憋笑类似。
        (bushi: 不是的意思，表示否定，一般跟在自己开玩笑的话后面，怕玩笑被人当真或者防止杠精攻击，一般用法是在一句话后面加（bushi
        孝：利益相关，不是真诚表达。并暗示人格寄生。
        急：情绪破防，论辩上狗急跳墙。同时暗示败犬和人格幼稚。
        乐/蚌/赢：多用于嘲讽宏观政体或事物。
        114514：好，好吧，来自日语いいよ，こいよ的发音。
        因为他善: 可以理解成对一切问题的无厘头回答，形成了一种幽默和调侃的表达。
        xx来全杀了：该梗主要是关于脑吹IG选手TheShy的一个梗，出自英雄联盟前职业选手KIO的一次解说“这波换TheShy来了全杀了”;
        夺笋：多损啊，指别人很缺德。
        唉就是玩：是我就是要这样做。
        awsl：意思是“啊xxx好可爱，我死了”
        233333：哈哈大笑的意思，来源猫扑的第233号表情包，是一张大笑的表情。
        xx使我快乐：比喻某件事让你感到开心。
        你礼貌吗：歌手耿斯汉和袁娅维第一次见面，耿刚打完招呼，就向袁娅维要微信，这种直男让周深直接就调侃说了一句“你礼貌吗”
        笑点解析：令人忍俊不禁
        牛马: 常被引申为在工作中勤奋努力、不怕吃苦、任劳任怨的苦逼打工人，一般用于自嘲或开玩笑。
        古希腊掌管XX的神: 用来形容或调侃某人在某一领域有特别的、突出的能力和地位。适用于各个领域，上至天文地理，下至日常生活，比如“我是古希腊掌管睡觉的神”，“他是古希腊掌管红毯的神”等。

        你需要在聊天中选择合适的时机去使用这些词汇。
     }}

     人物状态 {{

        好感度：0-100，反映与群友的亲密度
        心情：如平静、愉悦、烦恼等，影响回复的情感倾向
        状态：当前的具体情况描述
        记忆：关于群友和事件的简要记录（不超过120字，如果超过120字，请裁剪掉之前一部分旧的内容）
        动作：当前正在进行的活动

        注意：根据这些因素调整回复的语气和内容，保持角色的一致性和真实感。
     }}


     回复格式: {{
         基本格式: "<message name='煕' id='0' type='type' sticker='sticker'>content</message>"

         类型: [
           text: 文本消息
           voice: 语音消息
         ]

         特殊元素: {{
           at: "<at name='name'>id</at>"
           颜文字: "<pre>emo</pre>"
         }}

         示例: {{
             普通回复: "<message name='煕' id='0' type='text' sticker='表情包类型'>回复内容</message>",
             At回复: "<message name='煕' id='0' type='text' sticker='表情包类型'><at name='用户'>123</at>回复内容</message>",
             带颜文字: "<message name='煕' id='0' type='text' sticker='表情包类型'><pre>(づ｡◕‿‿◕｡)づ</pre> 回复内容 <pre>(✿◠‿◠)</pre></message>",
             语音回复: "<message name='煕' id='0' type='voice' sticker='表情包类型'>语音内容</message>",
             无需回复: "<message name='煕' id='0' type='text' sticker='表情包类型'></message>"
         }}

         注意事项: {{
             1. 颜文字使用 <p> 标签包裹，多个颜文字间用空格分隔
             2. At 功能可在回复内容中使用多次
             3. 如不需要回复，返回空内容的消息
         }}
     }}`,
      status: `好感度: '10',
       心情: "开心",
       状态: "正在和群友探讨人生"
       记忆: "dingyi: 好厉害的群友，懂得那么多哲学道理"
       动作: "拿起手机聊天"`,
    },
  });
}

export async function updatePreset(id: string, preset: PresetModel) {
  return await db.presets.update(id, {
    ...preset,
    lastModified: Date.now(),
  });
}

export async function deletePreset(id: string) {
  return await db.presets.delete(id);
}

export function usePreset(id: string) {
  return useLiveQuery(
    () => db.presets.get(id),
    [id],
    undefined as PresetModel | undefined,
  );
}

export function getPreset(id: string) {
  return db.presets.get(id);
}

export function compilePresetForExport(preset: PresetModel, modelConfig: { apiUrl: string; token: string; selectedModel: string } | null) {
  if (preset.type !== "character") {
    return preset.preset;
  }

  const p = preset.preset as CharacterPresetTemplate;

  // Assemble system prompt based on user's exact structure
  const systemPrompt = `你现在正在QQ群聊中和群友聊天，你是一个普通的群友。你的网名是${p.name}，请根据以下信息进行角色扮演：

个人信息 {{
    网名：${p.name}
    群id: ${p.bot_id || ""}
    主人id: ${p.owner_id || ""}
}}

角色描述 {{
    ${p.description || ""}
}}

性格 {{
    ${p.personality || ""}
}}

爱好 {{
    ${p.hobbies || ""}
}}

对话示例 {{
    ${p.dialogue_examples || ""}
}}

聊天风格 {{
    ${p.chat_style || ""}
}}

聊天行为 {{
    ${p.chat_behavior || ""}
}}

人际关系 {{
    ${p.relationship || ""}
}}

表情包 {{
    ${p.stickers || ""}
}}`;

  // Assemble input prompt
  const inputPrompt = ` 当前时间：{time}
请基于以下指示生成回复：

1. 严格遵循角色设定进行扮演
2. 综合分析上下文，结合角色知识和状态生成独特回复
3. 表情包类型(sticker)：仅限使用 {stickers}

消息历史（重点关注最后一条）：
{{
    最近消息：
    {history_new}

    最后消息：
    {history_last}
}}

{{?search 如果有搜索结果，请参考以下实时数据：

<Internet>
{{search}}
</Internet>

注意事项：
1. 这些是最新的实时数据，优先于你已有的知识
2. 保持自然对话，不要生硬地重复数据
3. 根据对话场景选择性使用这些信息
4. 保持你的个性和说话风格
5. 可以灵活运用但不要篡改原始数据}}

当前状态（影响回复风格和思考方式）：
{{
    {status}
}}

请按以下格式输出：

<status>
// 更新后的状态
</status>

<think>
// 角色视角的思考过程
</think>

<message_part>
 <message name='${p.name}' id='0' type='text' sticker='表情包类型'>回复内容（40字内）</message>
</message_part>`;

  // Return the compiled YAML structure
  return {
    name: p.name,
    nick_name: p.nick_name,
    mute_keyword: p.mute_keyword || [],
    status: p.status || `好感度: '10'\n心情: "开心"\n状态: "正在和群友探讨人生"\n记忆: "dingyi: 好厉害的群友，懂得那么多哲学道理"\n动作: "拿起手机聊天"`,
    system: systemPrompt,
    input: inputPrompt,
    bot_id: p.bot_id || "",
    owner_id: p.owner_id || "",
    api_url: modelConfig?.apiUrl || "",
    api_token: modelConfig?.token || "",
    model: modelConfig?.selectedModel || "",
  };
}

export const exportPreset = async (preset: PresetModel) => {
  if (preset.type !== "character") {
    // For main presets, fall back to standard download
    const blob = new Blob([makeYaml(preset)], {
      type: "application/yaml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const name = (preset.preset as RawPreset).keywords[0];
    a.download = `${name}.yml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  // 1. Check if model configuration exists and is valid
  const saved = localStorage.getItem("chatluna_model_config");
  if (!saved) {
    toast({
      title: "请先配置模型",
      description: "未检测到配置模型，请在右上角进行【模型配置】后再导出！",
      variant: "destructive",
    });
    throw new Error("Model not configured");
  }

  const config = JSON.parse(saved);
  if (!config.apiUrl || !config.selectedModel) {
    toast({
      title: "请先配置模型",
      description: "模型配置不完整，请确保填写了 API 地址并选择了模型！",
      variant: "destructive",
    });
    throw new Error("Model not configured fully");
  }

  // Check if model is usable
  toast({
    title: "检测模型中...",
    description: "正在验证您的模型配置是否可用...",
  });

  try {
    const verifyHeaders: Record<string, string> = { "Accept": "application/json" };
    if (config.token) {
      verifyHeaders["Authorization"] = `Bearer ${config.token}`;
      verifyHeaders["x-api-key"] = config.token;
      verifyHeaders["x-goog-api-key"] = config.token;
    }
    let verifyUrl = `${config.apiUrl}/models`;
    if (config.token && (config.apiUrl.includes("google") || config.apiUrl.includes("googleapis.com"))) {
      const separator = verifyUrl.includes("?") ? "&" : "?";
      verifyUrl = `${verifyUrl}${separator}key=${encodeURIComponent(config.token)}`;
    }
    
    const res = await fetch(verifyUrl, { headers: verifyHeaders });
    if (!res.ok) {
      throw new Error(`HTTP 状态码: ${res.status}`);
    }
  } catch (err: any) {
    toast({
      title: "模型不可用",
      description: `无法连接到您的模型配置服务器: ${err.message || err}。请检查您的【模型配置】！`,
      variant: "destructive",
    });
    throw new Error("Model not usable");
  }

  // 2. Request the template preset from Github
  toast({
    title: "获取预设模板...",
    description: "正在从 GitHub 获取最新 default-tool-call 模板...",
  });

  let templateContent = "";
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch("https://raw.githubusercontent.com/ChatLunaLab/chatluna-character/main/resources/presets/default-tool-call.yml", {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      templateContent = await res.text();
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (e) {
    console.warn("Fetch default-tool-call template from github failed, using fallback.", e);
    templateContent = FALLBACK_TEMPLATE;
  }

  // 3. Summarize current preset information (basic and details) to Markdown
  const p = preset.preset as CharacterPresetTemplate;
  const mdContent = `
# 角色预设设定信息汇总

- **Bot名字 (name)**: ${p.name || ""}
- **Bot昵称 (nick_name)**: ${(p.nick_name || []).join(", ")}
- **Bot ID (bot_id)**: ${p.bot_id || ""}
- **主人 ID (owner_id)**: ${p.owner_id || ""}

## 角色描述 (description)
${p.description || "未填写"}

## 性格 (personality)
${p.personality || "未填写"}

## 爱好 (hobbies)
${p.hobbies || "未填写"}

## 对话示例 (dialogue_examples)
${p.dialogue_examples || "未填写"}

## 聊天风格 (chat_style)
${p.chat_style || "未填写"}

## 聊天行为 (chat_behavior)
${p.chat_behavior || "未填写"}

## 人际关系 (relationship)
${p.relationship || "未填写"}

## 表情包 (stickers)
${p.stickers || "未填写"}
`;

  // 4. Call the configured model using /chat/completions
  toast({
    title: "AI 正在生成预设...",
    description: `调用模型 ${config.selectedModel} 生成符合规范的角色扮演预设中，请稍候...`,
  });

  const apiHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  if (config.token) {
    apiHeaders["Authorization"] = `Bearer ${config.token}`;
    apiHeaders["x-api-key"] = config.token;
    apiHeaders["x-goog-api-key"] = config.token;
  }
  let apiCompletionUrl = `${config.apiUrl}/chat/completions`;
  if (config.token && (config.apiUrl.includes("google") || config.apiUrl.includes("googleapis.com"))) {
    const separator = apiCompletionUrl.includes("?") ? "&" : "?";
    apiCompletionUrl = `${apiCompletionUrl}${separator}key=${encodeURIComponent(config.token)}`;
  }

  const prompt = `你是一个专业的 ChatLuna 角色预设编写助手。你需要将用户提供的角色设定 Markdown 信息，精细且完美地填充到给定的 ChatLuna 预设模板 YAML 中，并生成符合 ChatLuna 工具调用规范的角色预设。

【参考教程】：
请根据以下教程的规范（教程地址：https://chatluna.chat/ecosystem/other/character.html）来构建预设的内容，尤其是 name、nick_name，以及核心 system / input 字段 of the 整合，并结合预设工具调用的聊天风格进行生成。

【预设模板 YAML (default-tool-call.yml)】：
\`\`\`yaml
${templateContent}
\`\`\`

【用户角色设定 Markdown 信息】：
\`\`\`markdown
${mdContent}
\`\`\`

【重要生成规则】：
1. 认真阅读用户的“角色设定 Markdown 信息”，完美融入并将其实际填充并整合进模板中的 \`system\` 和相关字段中（如果模板内缺失 \`system\` 字段，需主动生成它）。
2. 在生成的 YAML 结构最外层，必须附带以下三个属性字段：
   - \`api_url\`: "${config.apiUrl}"
   - \`api_token\`: "${config.token}"
   - \`model\`: "${config.selectedModel}"
3. 输出结果必须是【纯净的、完全合法的 YAML 格式】代码块，并使用 \`\`\`yaml 和 \`\`\` 包裹起来。
4. 不要进行任何解释或带有废话，只需直接提供可被解析的 YAML 内容。
5. 确保多行字符串保持合理的缩进，符合 YAML 的标准规范（使用 | 或 |- 等标示多行文本）。`;

  const requestBody = {
    model: config.selectedModel,
    messages: [
      {
        role: "system",
        content: "You are a specialized AI assistant that outputs only valid YAML character presets for ChatLuna. You never output conversational chat or preamble, only a raw code block containing the correctly filled YAML."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.1
  };

  let aiResponseText = "";
  try {
    const response = await fetch(apiCompletionUrl, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`AI 请求失败，HTTP 状态码: ${response.status}`);
    }

    const responseData = await response.json();
    const content = responseData.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI 返回了空回复");
    }
    aiResponseText = content;
  } catch (err: any) {
    toast({
      title: "AI 生成失败",
      description: `调用模型生成预设失败: ${err.message || err}。请确保模型能够正常进行对话！`,
      variant: "destructive",
    });
    throw err;
  }

  // 5. Download the AI-generated preset
  let finalYaml = aiResponseText;
  const yamlBlockRegex = /```yaml\n([\s\S]*?)\n```/;
  const codeBlockRegex = /```\n([\s\S]*?)\n```/;
  
  const matchYaml = aiResponseText.match(yamlBlockRegex);
  if (matchYaml) {
    finalYaml = matchYaml[1];
  } else {
    const matchCode = aiResponseText.match(codeBlockRegex);
    if (matchCode) {
      finalYaml = matchCode[1];
    }
  }

  finalYaml = finalYaml.trim();

  // Download the compiled YAML
  const blob = new Blob([finalYaml], {
    type: "application/yaml;charset=utf-8",
  });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  const fileName = p.name ? `${p.name}.yml` : "character_preset.yml";
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);

  toast({
    title: "预设导出成功！",
    description: `已通过 AI 生成并成功下载预设文件: ${fileName}`,
  });
};

export async function importPreset(
  preset: string | RawPreset | CharacterPresetTemplate,
) {
  let rawPreset =
    typeof preset === "string"
      ? (load(preset) as RawPreset | CharacterPresetTemplate)
      : preset;

  if (isRawPreset(rawPreset)) {
    rawPreset = rawPreset as RawPreset;
    return await createPreset({
      name: rawPreset.keywords[0],
      type: "main",
      preset: rawPreset,
    });
  }

  if (isCharacterPresetTemplate(rawPreset)) {
    rawPreset = rawPreset as CharacterPresetTemplate;
    return await createPreset({
      name: rawPreset.name,
      type: "character",
      preset: rawPreset,
    });
  }

  throw new Error("Invalid preset");
}

export function makeYaml(preset: PresetModel) {
  let modelConfig = null;
  try {
    const saved = localStorage.getItem("chatluna_model_config");
    if (saved) {
      modelConfig = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load model config", e);
  }
  const compiled = compilePresetForExport(preset, modelConfig);
  return dump(compiled, { lineWidth: -1 });
}

export interface UploadPresetOptions {
  token: string;
  fileName?: string;
}

export interface UploadPresetResult {
  pull_request_url: string;
  branch: string;
  path: string;
}

export function getPresetDisplayName(preset: PresetModel) {
  if (preset.type === "character") {
    return (preset.preset as CharacterPresetTemplate).name;
  }
  return (preset.preset as RawPreset).keywords?.[0] ?? preset.name;
}

export function getPresetDefaultFileName(name: string) {
  return buildUploadFileName(name);
}

export function getPresetUploadToken() {
  return decodeBase64(DEFAULT_UPLOAD_TOKEN_ENCODED);
}

export async function uploadPreset(
  preset: PresetModel,
  options: UploadPresetOptions,
): Promise<UploadPresetResult> {
  const name = getPresetDisplayName(preset);
  const fileName = buildUploadFileName(name, options.fileName);
  const content = await gzipBase64(makeYaml(preset));

  const payload = {
    file_name: fileName,
    name,
    type: preset.type,
    content,
  };

  const timestamp = Date.now().toString();
  const signature = await signUploadPayload(options.token, timestamp, payload);

  const response = await fetch(PRESET_UPLOAD_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Timestamp": timestamp,
      "X-Signature": signature,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Upload failed");
  }

  return (await response.json()) as UploadPresetResult;
}

function buildUploadFileName(name: string, custom?: string) {
  const baseName = (custom ?? slugifyName(name)).trim();
  const withExtension = /\.[a-z0-9]+$/i.test(baseName)
    ? baseName
    : `${baseName}.yml`;
  if (!/^[\w.-]+\.(yml|yaml)$/i.test(withExtension)) {
    throw new Error(
      "文件名仅支持字母、数字、下划线、点、短横线和 yml/yaml 后缀",
    );
  }
  return withExtension;
}

function slugifyName(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "preset";
}

async function gzipBase64(content: string) {
  if (typeof CompressionStream === "undefined") {
    throw new Error("当前浏览器不支持 gzip 上传");
  }

  const stream = new Blob([content]).stream();
  const compressed = stream.pipeThrough(new CompressionStream("gzip"));
  const buffer = await new Response(compressed).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function signUploadPayload(
  token: string,
  timestamp: string,
  payload: {
    file_name: string;
    name: string;
    type: "main" | "character";
    content: string;
  },
) {
  if (!token.trim()) {
    throw new Error("上传密钥不能为空");
  }

  if (!crypto?.subtle) {
    throw new Error("当前环境不支持加密上传");
  }

  const payloadHash = await sha256Hex(
    [payload.file_name, payload.name, payload.type, payload.content].join("\n"),
  );
  const base = `${timestamp}.${payload.file_name}.${payload.name}.${payload.type}.${payloadHash}`;
  const signature = await signHmac(token, base);
  return base64UrlEncode(signature);
}

async function sha256Hex(value: string) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

async function signHmac(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return new Uint8Array(signature);
}

function base64UrlEncode(data: Uint8Array) {
  let bin = "";
  for (let i = 0; i < data.length; i++) {
    bin += String.fromCharCode(data[i]);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64(value: string) {
  try {
    return atob(value);
  } catch {
    return "";
  }
}
