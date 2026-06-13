"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { PresetModel } from "@/hooks/use-preset";
import { CharacterPresetTemplate } from "@/types/preset";
import { Play, Terminal, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { load, dump } from "js-yaml";

interface CharacterExportProps {
    preset: PresetModel;
}

interface LogEntry {
    time: string;
    text: string;
    type: "info" | "error" | "success" | "warning";
}

const FALLBACK_TEMPLATE = `# 本文件最后更新时间：2026-04-03
# 
# 使用须知
# 
# 本预设依赖以下插件，请自行安装，不要忘记在修改后点击右上角的“重载配置”按钮：
# - chatluna-long-memory
#   - 插件用途：提供长期记忆功能
#   - 配置说明：
#     - 将所有“长期记忆引擎配置”改为“Basic”，“启用的记忆检索层”只勾选“群组层”
# - chatluna-forward-msg
#   - 插件用途：可选，提供合并转发记录读取、发送功能
#   - 配置说明：
#     - 在“协议选择”中启用“NapCat OneBot”或“LLBot OneBot”中你使用的协议
#     - 在“图片描述服务”中选择一个多模态模型
#     - 在 chatluna 插件的“对话行为选项”中启用：attachForwardMsgIdToContext
#     - 在 chatluna-character 插件对应会话配置的“上下文”中启用：enableMessageId
# - chatluna-plugin-common
#   - 插件用途：提供一些通用的工具，包括本预设中用到的群管工具
#   - 配置说明：
#     - 只启用“群管插件”，其他选项全部关闭
#     - 在“群管插件配置”中配置好“允许使用群管功能的成员 ID 列表”（可以要求 Bot 使用群管功能的人）和“允许使用群管功能的群 ID 白名单”
# - chatluna-toolbox
#   - 插件用途：提供戳一戳、贴表情、撤回消息等功能
#   - 配置说明：
#     - 在“原生工具”中启用“NapCat OneBot”或“LLBot OneBot”中你使用的协议
#     - 在“XML 工具”中启用除了“enableBanXmlTool”之外的全部选项
#     - 其他选项全部关闭
# - chatluna-storage-service
#   - 插件用途：提供文件存储服务，防止 QQ 图床链接过期
#   - 配置说明：
#     - 将“存储后端类型”改为“本地文件存储”
#     - 将“Koishi 在公网或者局域网中的路径”改为你的环境中实际的路径，确保此路径可以被你的 Napcat 或 LLBot 正常访问。
# 
# 作者的话：
# 感谢你使用了卢恩伪装插件预设模板！如有问题，敬请优先查询 ChatLuna 文档！

name: CHARACTER（工具调用）

nick_name:
    - CHARACTER
    - '@CHARACTER'

input: |
    # 当前时间
    {time}

    # 触发原因
    {trigger_reason}
    
    # 请基于以下指示生成回复
    - 严格遵循角色设定进行扮演
    - 综合分析上下文，结合角色知识和状态生成回复
    
    # 最近消息
    {history_new}
    
    # 最后消息
    {history_last}
    
    # 当前状态
    <status>
    {status}
    </status>

    # 长期记忆
    {long_memory('guild')}
    
    # 提示
    - 消息最开头的“CHARACTER”（若存在）只是一个对你的称呼，并不与后面的词构成组合关系，如：“CHARACTER硬盘怎么扩容”实际上是在问“硬盘怎么扩容？”
    - 并非每一条消息都需要回复
    - 有时候图片没能附加在你的上下文中，如undefined，`;

export function CharacterExport({ preset }: CharacterExportProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const consoleEndRef = useRef<HTMLDivElement>(null);

    const addLog = (text: string, type: LogEntry["type"] = "info") => {
        const time = new Date().toLocaleTimeString();
        setLogs((prev) => [...prev, { time, text, type }]);
    };

    // Auto-scroll console window to bottom
    useEffect(() => {
        consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const handleGenerate = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        setLogs([]); // Clear previous logs
        
        addLog("🚀 开始导出流程...", "info");

        // 1. Validate configuration
        addLog("Step 1: 正在自检浏览器模型配置...", "info");
        const saved = localStorage.getItem("chatluna_model_config");
        if (!saved) {
            addLog("❌ 错误：未检测到模型配置！请点击右上角【模型配置】设置您的 API 接口与密钥。", "error");
            toast({
                title: "请先配置模型",
                description: "未检测到配置模型，请在右上角进行【模型配置】后再导出！",
                variant: "destructive",
            });
            setIsGenerating(false);
            return;
        }

        const config = JSON.parse(saved);
        if (!config.apiUrl || !config.selectedModel) {
            addLog("❌ 错误：模型配置不完整！请确保已选择模型并正确填写了 API 地址。", "error");
            toast({
                title: "请先配置模型",
                description: "模型配置不完整，请确保填写了 API 地址并选择了模型！",
                variant: "destructive",
            });
            setIsGenerating(false);
            return;
        }

        addLog(`✅ 模型配置自检完成：[地址] ${config.apiUrl}  |  [模型] ${config.selectedModel}`, "success");
        addLog("正在验证接口可用性 (尝试连接 /models)...", "info");

        // Validate server connectivity with a 15-second timeout
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

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
            
            const res = await fetch(verifyUrl, { 
                headers: verifyHeaders,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                throw new Error(`服务器返回 HTTP ${res.status}`);
            }
            addLog("✅ 接口连接成功！服务器状态正常。", "success");
        } catch (err: any) {
            const errorMsg = err.name === "AbortError" ? "连接超时（15秒内无响应），API 站点响应缓慢" : (err.message || err);
            addLog(`❌ 错误：验证 API 接口失败 (${errorMsg})。若您的中转站不支持 /models 接口或存在网络跨域问题，请检查右上角配置。`, "error");
            toast({
                title: "接口连接失败",
                description: `连接失败: ${errorMsg}。请检查您的网络或【模型配置】。`,
                variant: "destructive",
            });
            setIsGenerating(false);
            return;
        }

        // 2. Fetch standard default-tool-call preset from GitHub
        addLog("Step 2: 正在请求最新的 ChatLuna 工具调用预设模板 (default-tool-call.yml)...", "info");
        let templateContent = "";
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout
            const res = await fetch("https://raw.githubusercontent.com/ChatLunaLab/chatluna-character/main/resources/presets/default-tool-call.yml", {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.ok) {
                templateContent = await res.text();
                addLog("✅ 成功从 GitHub 获取最新模板！", "success");
            } else {
                throw new Error(`HTTP ${res.status}`);
            }
        } catch (e: any) {
            addLog(`⚠️ 提示：从 GitHub 拉取模板失败或连接超时。已自动启用本地预置的标准 Fallback 模板。`, "warning");
            templateContent = FALLBACK_TEMPLATE;
        }

        // 3. Gather active details to Markdown
        addLog("Step 3: 正在整理预设的基础配置与详情设定为 Markdown 摘要...", "info");
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
        addLog("✅ 设定整理完毕。", "success");

        // 4. Request AI models
        addLog(`Step 4: 正在调用 AI 模型 [${config.selectedModel}] 重构整合预设文件...`, "info");
        addLog("⏳ 正在向您的接口发起生成请求，由于大模型重构预设时间可能较长，最长超时时间已设为 5 分钟，请耐心等待...", "warning");

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

        const prompt = `你是一个专业的 ChatLuna 角色预设编写助手。你需要将用户提供的角色设定 Markdown 信息，精细且完美地填充 to 给定的 ChatLuna 预设模板 YAML 中，并生成符合 ChatLuna 工具调用规范的角色预设。

【参考教程】：
请根据以下教程的规范（教程地址：https://chatluna.chat/ecosystem/other/character.html）来构建预设的内容，尤其是 name、nick_name，以及核心 system / input 字段的整合，并结合预设工具调用的聊天风格进行生成。

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
2. 【严禁输出任何 API 凭证和服务器连接参数】：导出的 YAML 结构中绝对不允许包含 \`api_url\`、\`api_token\`（或 \`token\`）和 \`model\` 字段，以确保文件信息脱敏且绝不泄露您的任何私钥。
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
            temperature: 0.15
        };

        let aiResponseText = "";
        try {
            // Set 5 minutes (300000 ms) timeout for large completions
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); 

            const response = await fetch(apiCompletionUrl, {
                method: "POST",
                headers: apiHeaders,
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`服务器返回错误，HTTP ${response.status}`);
            }

            const responseData = await response.json();
            const content = responseData.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error("AI 模型未返回有效回复内容（内容为空）");
            }
            aiResponseText = content;
            addLog("✅ AI 生成成功！正在提取和转换数据...", "success");
        } catch (err: any) {
            const errorMsg = err.name === "AbortError" ? "模型生成超时（5分钟响应超时），可能是您的模型输出速度慢或中转站响应迟缓" : (err.message || err);
            addLog(`❌ 错误：模型生成调用失败 (${errorMsg})。请检查您的网络连接、中转站点响应速度以及账户余额。`, "error");
            toast({
                title: "AI 生成失败",
                description: `调用模型生成预设失败: ${errorMsg}`,
                variant: "destructive",
            });
            setIsGenerating(false);
            return;
        }

        // 5. Clean up code block and download YAML
        addLog("Step 5: 提取 YAML 并执行自动下载...", "info");
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

        // 强力脱敏过滤：确保导出的 YAML 中绝对没有任何 api_url, api_token 和 model 属性
        try {
            const parsed = load(finalYaml) as any;
            if (parsed && typeof parsed === "object") {
                delete parsed.api_url;
                delete parsed.api_token;
                delete parsed.model;
                finalYaml = dump(parsed, { lineWidth: -1 });
                addLog("♻️ 预设过滤：已在客户端对导出的预设执行了 100% 格式纯净化脱敏过滤。", "success");
            }
        } catch (yamlErr) {
            console.warn("YAML parsing/scrubbing failed, using regex fallback", yamlErr);
            // 备用正则行过滤器：防止 AI 输出的格式问题导致 js-yaml 解析错误而降级下载
            finalYaml = finalYaml
                .split("\n")
                .filter(line => {
                    const trimmed = line.trim();
                    return !trimmed.startsWith("api_url:") && 
                           !trimmed.startsWith("api_token:") && 
                           !trimmed.startsWith("model:");
                })
                .join("\n");
        }

        if (!finalYaml.includes("name:") && !finalYaml.includes("input:")) {
            addLog("⚠️ 警告：AI 生成的内容似乎没有包含合法的 YAML 属性。请检查模型的回复质量或更换更强大的模型。", "warning");
        }

        try {
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

            addLog(`🎉 导出圆满完成！已成功触发下载文件：${fileName}`, "success");
            toast({
                title: "预设导出成功！",
                description: `已通过 AI 生成并成功下载预设文件: ${fileName}`,
            });
        } catch (downloadErr: any) {
            addLog(`❌ 下载错误：创建文件下载流失败 (${downloadErr.message || downloadErr})`, "error");
        }

        setIsGenerating(false);
    };

    return (
        <div className="flex flex-col gap-6 py-4">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4 border p-5 rounded-2xl bg-muted/10">
                <div className="space-y-1.5 flex-1">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                        <FileText className="w-5 h-5 text-primary" />
                        AI 智能生成并导出预设
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                        该功能将自检模型配置，拉取最新的 ChatLuna 工具调用模板（default-tool-call.yml），自动把“基础信息”和“详情设定”整合汇总，由您在右上角配置的 AI 智能填充为符合官方最新标准的伪装预设配置文件。
                    </p>
                </div>
                <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating}
                    size="lg"
                    className="w-full md:w-auto font-semibold gap-2 py-6 px-8 rounded-xl shadow-md transition-all duration-200"
                >
                    {isGenerating ? (
                        <>
                            <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></span>
                            <span>正在生成中...</span>
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4 fill-current" />
                            <span>生成并导出预设</span>
                        </>
                    )}
                </Button>
            </div>

            {/* Console Log Area */}
            <div className="border rounded-2xl overflow-hidden bg-zinc-950 shadow-inner flex flex-col h-[400px]">
                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900/50 text-zinc-400">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Terminal className="w-4 h-4 text-emerald-500" />
                        <span>执行日志控制台</span>
                    </div>
                    {logs.length > 0 && (
                        <button 
                            onClick={() => setLogs([])}
                            className="text-xs hover:text-zinc-200 hover:bg-zinc-800 px-2.5 py-1 rounded-md transition-colors"
                        >
                            清空日志
                        </button>
                    )}
                </div>

                <div className="flex-1 p-5 overflow-y-auto font-mono text-xs space-y-2 select-text selection:bg-zinc-800 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
                            <Terminal className="w-8 h-8 opacity-40 animate-pulse text-zinc-500" />
                            <p>控制台就绪，请点击上方“生成并导出预设”开始...</p>
                        </div>
                    ) : (
                        logs.map((log, index) => {
                            let textClass = "text-zinc-300";
                            if (log.type === "error") textClass = "text-rose-400 font-semibold";
                            if (log.type === "success") textClass = "text-emerald-400 font-semibold";
                            if (log.type === "warning") textClass = "text-amber-400";

                            return (
                                <div key={index} className="flex items-start gap-3 hover:bg-zinc-900/40 py-0.5 px-1 rounded transition-colors">
                                    <span className="text-zinc-600 shrink-0 select-none">[{log.time}]</span>
                                    <span className={textClass}>{log.text}</span>
                                </div>
                            );
                        })
                    )}
                    <div ref={consoleEndRef} />
                </div>
            </div>
        </div>
    );
}
