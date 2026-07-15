export type TemplateEditorContext =
  | "prompt"
  | "format-user"
  | "world-lore"
  | "author-note"
  | "knowledge"
  | "memory"
  | "character-system"
  | "character-input"
  | "character-preset"
  | "main-preset"
  | "generic";

export type TemplateRangeKind =
  | "expression"
  | "control"
  | "escaped"
  | "unknown"
  | "error";

export interface TemplateRange {
  from: number;
  to: number;
  kind: TemplateRangeKind;
  message?: string;
}

export interface TemplateCompletionDefinition {
  label: string;
  detail: string;
  type: "variable" | "function" | "keyword";
  contexts?: TemplateEditorContext[];
  snippet?: string;
}

const MAIN_TEMPLATE_CONTEXTS: TemplateEditorContext[] = [
  "prompt",
  "format-user",
  "world-lore",
  "author-note",
  "knowledge",
  "memory",
  "main-preset",
  "generic",
];

const COMMON_DEFINITIONS: TemplateCompletionDefinition[] = [
  { label: "date", detail: "当前 UTC 日期", type: "variable" },
  { label: "isotime", detail: "当前 ISO 时间", type: "variable" },
  { label: "isodate", detail: "当前 ISO 日期", type: "variable" },
  { label: "weekday", detail: "当前星期", type: "variable" },
  {
    label: "message_id",
    detail: "当前消息 ID",
    type: "variable",
    contexts: MAIN_TEMPLATE_CONTEXTS,
  },
  {
    label: "is_group",
    detail: "是否为群聊",
    type: "variable",
    contexts: MAIN_TEMPLATE_CONTEXTS,
  },
  {
    label: "is_private",
    detail: "是否为私聊",
    type: "variable",
    contexts: MAIN_TEMPLATE_CONTEXTS,
  },
  {
    label: "idle_duration",
    detail: "距上次消息的时间",
    type: "variable",
    contexts: MAIN_TEMPLATE_CONTEXTS,
  },
  {
    label: "bot_id",
    detail: "机器人 ID",
    type: "variable",
    contexts: MAIN_TEMPLATE_CONTEXTS,
  },
  {
    label: "name",
    detail: "机器人名称",
    type: "variable",
    contexts: MAIN_TEMPLATE_CONTEXTS,
  },
  {
    label: "random",
    detail: "随机选择或生成随机整数",
    type: "function",
    snippet: "random('${option1}', '${option2}')}",
  },
  {
    label: "roll",
    detail: "使用 D&D 语法投掷骰子",
    type: "function",
    snippet: "roll('${d6}')}",
  },
  {
    label: "time_UTC",
    detail: "获取指定 UTC 偏移的时间",
    type: "function",
    snippet: "time_UTC('${offset}')}",
  },
  {
    label: "url",
    detail: "发送网络请求",
    type: "function",
    snippet: "url('${method}', '${url}')}",
  },
  {
    label: "concat",
    detail: "连接多个值",
    type: "function",
    snippet: "concat('${text}', name)}",
  },
];

const CONTEXT_DEFINITIONS: TemplateCompletionDefinition[] = [
  {
    label: "time",
    detail: "当前时间",
    type: "variable",
    contexts: ["character-input", "character-preset"],
  },
  {
    label: "trigger_reason",
    detail: "本次回复的触发原因",
    type: "variable",
    contexts: ["character-input", "character-preset"],
  },
  {
    label: "history_new",
    detail: "最近的消息记录",
    type: "variable",
    contexts: ["character-input", "character-preset"],
  },
  {
    label: "history_last",
    detail: "最后一条消息",
    type: "variable",
    contexts: ["character-input", "character-preset"],
  },
  {
    label: "status",
    detail: "角色当前状态",
    type: "variable",
    contexts: ["character-input", "character-preset"],
  },
  {
    label: "prompt",
    detail: "当前触发消息原文",
    type: "variable",
    contexts: ["character-input", "character-preset"],
  },
  {
    label: "built",
    detail: "预设名称与会话 ID 等内置信息",
    type: "variable",
    contexts: ["character-input", "character-preset"],
  },
  {
    label: "long_memory",
    detail: "长期记忆，需要安装长期记忆扩展",
    type: "function",
    contexts: ["character-input", "character-preset"],
    snippet: "long_memory('${scope}')}",
  },
  {
    label: "memesluna",
    detail: "表情包分类提示，需要安装表情包扩展",
    type: "variable",
    contexts: ["character-system", "character-preset"],
  },
  {
    label: "base_url",
    detail: "表情包服务基础地址",
    type: "variable",
    contexts: ["character-system", "character-preset"],
  },
  {
    label: "sender",
    detail: "发送者昵称",
    type: "variable",
    contexts: ["format-user", "main-preset"],
  },
  {
    label: "sender_id",
    detail: "发送者 ID",
    type: "variable",
    contexts: ["format-user", "main-preset"],
  },
  {
    label: "prompt",
    detail: "用户实际发送的内容",
    type: "variable",
    contexts: ["format-user", "main-preset"],
  },
  {
    label: "user",
    detail: "发送者昵称",
    type: "variable",
    contexts: [
      "prompt",
      "world-lore",
      "author-note",
      "knowledge",
      "memory",
      "main-preset",
    ],
  },
  {
    label: "user_id",
    detail: "发送者 ID",
    type: "variable",
    contexts: [
      "prompt",
      "world-lore",
      "author-note",
      "knowledge",
      "memory",
      "main-preset",
    ],
  },
  {
    label: "long_history",
    detail: "可用的长期记忆",
    type: "variable",
    contexts: ["memory"],
  },
  {
    label: "user_input",
    detail: "长期记忆输入内容",
    type: "variable",
    contexts: ["memory"],
  },
  {
    label: "input",
    detail: "世界书内容",
    type: "variable",
    contexts: ["memory"],
  },
];

const CONTROL_DEFINITIONS: TemplateCompletionDefinition[] = [
  {
    label: "if",
    detail: "插入完整条件块",
    type: "keyword",
    snippet: "if ${condition}}\n  ${}\n{/if}",
  },
  {
    label: "if / else",
    detail: "插入带 else 的完整条件块",
    type: "keyword",
    snippet: "if ${condition}}\n  ${trueContent}\n{else}\n  ${falseContent}\n{/if}",
  },
  {
    label: "if / elseif / else",
    detail: "插入多分支条件块",
    type: "keyword",
    snippet:
      "if ${condition}}\n  ${firstContent}\n{elseif ${otherCondition}}\n  ${secondContent}\n{else}\n  ${fallbackContent}\n{/if}",
  },
  {
    label: "for",
    detail: "插入完整数组循环",
    type: "keyword",
    snippet: "for ${item} in ${items}}\n  ${}\n{/for}",
  },
  {
    label: "while",
    detail: "插入完整条件循环",
    type: "keyword",
    snippet: "while ${condition}}\n  ${}\n{/while}",
  },
  {
    label: "repeat",
    detail: "插入完整重复块",
    type: "keyword",
    snippet: "repeat ${count}}\n  ${}\n{/repeat}",
  },
];

export function getTemplateDefinitions(context: TemplateEditorContext) {
  return [
    ...COMMON_DEFINITIONS.filter(
      (definition) =>
        definition.contexts == null || definition.contexts.includes(context),
    ),
    ...CONTEXT_DEFINITIONS.filter(
      (definition) =>
        definition.contexts == null || definition.contexts.includes(context),
    ),
    ...CONTROL_DEFINITIONS,
  ];
}

export function analyzeTemplate(
  source: string,
  context: TemplateEditorContext,
): TemplateRange[] {
  const ranges: TemplateRange[] = [];
  const knownNames = new Set(
    getTemplateDefinitions(context).map((definition) => definition.label),
  );
  const controlStack: {
    name: ControlName;
    rangeIndex: number;
    variable?: string;
  }[] = [];

  let position = 0;
  while (position < source.length) {
    const pair = source.slice(position, position + 2);
    if (pair === "{{" || pair === "}}") {
      ranges.push({
        from: position,
        to: position + 2,
        kind: "escaped",
      });
      position += 2;
      continue;
    }

    if (source[position] !== "{") {
      position += 1;
      continue;
    }

    const tag = readTemplateTag(source, position);
    if (tag == null) {
      ranges.push({
        from: position,
        to: source.length,
        kind: "error",
        message: "花括号没有闭合；ChatLuna 会将它保留为普通文本",
      });
      break;
    }

    const content = tag.content.trim();
    const control = parseControlTag(content);
    if (control.valid) {
      const range: TemplateRange = {
        from: position,
        to: tag.to,
        kind: "control",
      };
      ranges.push(range);

      const currentBlock = controlStack[controlStack.length - 1];
      if (control.action === "open") {
        controlStack.push({
          name: control.name,
          rangeIndex: ranges.length - 1,
          variable: control.variable,
        });
      } else if (control.action === "branch") {
        if (currentBlock?.name !== "if") {
          range.kind = "error";
          range.message = `${content.startsWith("elseif") ? "elseif" : "else"} 必须位于 if 块内`;
        }
      } else if (control.action === "close") {
        if (currentBlock?.name === control.name) {
          controlStack.pop();
        } else {
          range.kind = "error";
          range.message = `没有找到与 {/${control.name}} 匹配的开始标签`;
        }
      }
      position = tag.to;
      continue;
    }

    const expression = parseTemplateExpression(content);
    if (!expression.valid) {
      ranges.push({
        from: position,
        to: tag.to,
        kind: "error",
        message: "模板表达式无效；如果这是普通文本，请转义花括号",
      });
      position = tag.to;
      continue;
    }

    const activeNames = new Set(knownNames);
    for (const block of controlStack) {
      if (block.variable) activeNames.add(block.variable);
    }
    const unknownNames = expression.identifiers.filter(
      (identifier) => !activeNames.has(identifier),
    );
    ranges.push({
      from: position,
      to: tag.to,
      kind: unknownNames.length > 0 ? "unknown" : "expression",
      message:
        unknownNames.length > 0
          ? `未在内置变量中找到 ${unknownNames.join("、")}；如果这是普通文本，请转义花括号`
          : undefined,
    });
    position = tag.to;
  }

  for (const block of controlStack) {
    const range = ranges[block.rangeIndex];
    range.kind = "error";
    range.message = `{${block.name}} 块缺少 {/${block.name}} 结束标签`;
  }

  return ranges;
}

export function escapeTemplateBraces(value: string) {
  let result = "";
  let position = 0;

  while (position < value.length) {
    const pair = value.slice(position, position + 2);
    if (pair === "{{" || pair === "}}") {
      result += pair;
      position += 2;
      continue;
    }

    const character = value[position];
    if (character === "{") {
      result += "{{";
    } else if (character === "}") {
      result += "}}";
    } else {
      result += character;
    }
    position += 1;
  }

  return result;
}

function readTemplateTag(source: string, from: number) {
  let position = from + 1;
  let depth = 1;
  let quote = "";

  while (position < source.length) {
    const character = source[position];
    if (quote) {
      if (character === "\\") {
        position += 2;
        continue;
      }
      if (character === quote) quote = "";
      position += 1;
      continue;
    }

    if (character === "\"" || character === "'") {
      quote = character;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return {
          content: source.slice(from + 1, position),
          to: position + 1,
        };
      }
    }
    position += 1;
  }

  return null;
}

type ControlName = "if" | "for" | "while" | "repeat";

type ControlTagResult =
  | {
      valid: true;
      action: "open";
      name: ControlName;
      variable?: string;
    }
  | { valid: true; action: "branch"; name: "if" }
  | { valid: true; action: "close"; name: ControlName }
  | { valid: false };

function parseControlTag(content: string): ControlTagResult {
  if (content === "else") {
    return { valid: true, action: "branch", name: "if" };
  }

  for (const name of ["if", "for", "while", "repeat"] as const) {
    if (content === `/${name}`) {
      return { valid: true, action: "close", name };
    }
  }

  if (content.startsWith("elseif ")) {
    const expression = parseTemplateExpression(content.slice(7));
    return expression.valid
      ? { valid: true, action: "branch", name: "if" }
      : { valid: false };
  }

  for (const name of ["if", "while", "repeat"] as const) {
    const prefix = `${name} `;
    if (content.startsWith(prefix)) {
      const expression = parseTemplateExpression(content.slice(prefix.length));
      return expression.valid
        ? { valid: true, action: "open", name }
        : { valid: false };
    }
  }

  if (content.startsWith("for ")) {
    const match = content.match(
      /^for\s+([A-Za-z_$][A-Za-z0-9_$]*)\s+in\s+(.+)$/,
    );
    const expression = match ? parseTemplateExpression(match[2]) : null;
    return match && expression?.valid
      ? { valid: true, action: "open", name: "for", variable: match[1] }
      : { valid: false };
  }

  return { valid: false };
}

type ExpressionToken =
  | { type: "number" | "string" | "keyword"; value: string }
  | { type: "identifier"; value: string }
  | { type: "operator"; value: string }
  | { type: "punctuation"; value: string }
  | { type: "eof"; value: "" };

function parseTemplateExpression(source: string) {
  try {
    const lexer = new ExpressionLexer(source);
    const parser = new ExpressionParser(lexer.tokenize());
    return parser.parse();
  } catch {
    return { valid: false, identifiers: [] as string[] };
  }
}

class ExpressionLexer {
  private position = 0;

  constructor(private readonly source: string) {}

  tokenize(): ExpressionToken[] {
    const tokens: ExpressionToken[] = [];

    while (this.position < this.source.length) {
      this.skipWhitespace();
      if (this.position >= this.source.length) break;

      const character = this.source[this.position];
      if (character === "\"" || character === "'") {
        tokens.push(this.readString(character));
        continue;
      }
      if (/[0-9]/.test(character)) {
        tokens.push(this.readNumber());
        continue;
      }
      if (/[A-Za-z_$]/.test(character)) {
        tokens.push(this.readIdentifier());
        continue;
      }

      const pair = this.source.slice(this.position, this.position + 2);
      if (["==", "!=", "<=", ">=", "&&", "||"].includes(pair)) {
        tokens.push({ type: "operator", value: pair });
        this.position += 2;
        continue;
      }
      if (["+", "-", "*", "/", "%", "<", ">", "!"].includes(character)) {
        tokens.push({ type: "operator", value: character });
        this.position += 1;
        continue;
      }
      if (["(", ")", "[", "]", ".", ",", "?", ":"].includes(character)) {
        tokens.push({ type: "punctuation", value: character });
        this.position += 1;
        continue;
      }

      throw new Error("Unexpected expression character");
    }

    tokens.push({ type: "eof", value: "" });
    return tokens;
  }

  private skipWhitespace() {
    while (/\s/.test(this.source[this.position] ?? "")) this.position += 1;
  }

  private readString(quote: string): ExpressionToken {
    this.position += 1;
    let value = "";

    while (this.position < this.source.length) {
      const character = this.source[this.position];
      if (character === quote) {
        this.position += 1;
        return { type: "string", value };
      }
      if (character === "\\") {
        this.position += 1;
        if (this.position >= this.source.length) break;
      }
      value += this.source[this.position];
      this.position += 1;
    }

    throw new Error("Unterminated string");
  }

  private readNumber(): ExpressionToken {
    const from = this.position;
    while (/[0-9]/.test(this.source[this.position] ?? "")) this.position += 1;
    if (this.source[this.position] === ".") {
      this.position += 1;
      while (/[0-9]/.test(this.source[this.position] ?? "")) this.position += 1;
    }
    return { type: "number", value: this.source.slice(from, this.position) };
  }

  private readIdentifier(): ExpressionToken {
    const from = this.position;
    while (/[A-Za-z0-9_$]/.test(this.source[this.position] ?? "")) {
      this.position += 1;
    }
    const value = this.source.slice(from, this.position);
    return {
      type: ["true", "false", "null"].includes(value)
        ? "keyword"
        : "identifier",
      value,
    };
  }
}

class ExpressionParser {
  private position = 0;
  private identifiers = new Set<string>();

  constructor(private readonly tokens: ExpressionToken[]) {}

  parse() {
    this.parseConditional();
    if (this.current().type !== "eof") throw new Error("Unexpected token");
    return { valid: true, identifiers: [...this.identifiers] };
  }

  private parseConditional() {
    this.parseLogicalOr();
    if (this.consumePunctuation("?")) {
      this.parseConditional();
      this.expectPunctuation(":");
      this.parseConditional();
    }
  }

  private parseLogicalOr() {
    this.parseLogicalAnd();
    while (this.consumeOperator("||")) this.parseLogicalAnd();
  }

  private parseLogicalAnd() {
    this.parseEquality();
    while (this.consumeOperator("&&")) this.parseEquality();
  }

  private parseEquality() {
    this.parseRelational();
    while (this.consumeOperator("==") || this.consumeOperator("!=")) {
      this.parseRelational();
    }
  }

  private parseRelational() {
    this.parseAdditive();
    while (
      this.consumeOperator("<=") ||
      this.consumeOperator(">=") ||
      this.consumeOperator("<") ||
      this.consumeOperator(">")
    ) {
      this.parseAdditive();
    }
  }

  private parseAdditive() {
    this.parseMultiplicative();
    while (this.consumeOperator("+") || this.consumeOperator("-")) {
      this.parseMultiplicative();
    }
  }

  private parseMultiplicative() {
    this.parseUnary();
    while (
      this.consumeOperator("*") ||
      this.consumeOperator("/") ||
      this.consumeOperator("%")
    ) {
      this.parseUnary();
    }
  }

  private parseUnary() {
    if (
      this.consumeOperator("!") ||
      this.consumeOperator("-") ||
      this.consumeOperator("+")
    ) {
      this.parseUnary();
      return;
    }
    this.parsePostfix();
  }

  private parsePostfix() {
    this.parsePrimary();

    while (true) {
      if (this.consumePunctuation(".")) {
        this.expect("identifier");
      } else if (this.consumePunctuation("[")) {
        this.parseConditional();
        this.expectPunctuation("]");
      } else if (this.consumePunctuation("(")) {
        if (!this.consumePunctuation(")")) {
          do {
            this.parseConditional();
          } while (this.consumePunctuation(","));
          this.expectPunctuation(")");
        }
      } else {
        break;
      }
    }
  }

  private parsePrimary() {
    const token = this.current();
    if (["string", "number", "keyword"].includes(token.type)) {
      this.position += 1;
      return;
    }
    if (token.type === "identifier") {
      this.identifiers.add(token.value);
      this.position += 1;
      return;
    }
    if (this.consumePunctuation("(")) {
      this.parseConditional();
      this.expectPunctuation(")");
      return;
    }
    throw new Error("Expected expression");
  }

  private current() {
    return this.tokens[this.position];
  }

  private consumeOperator(value: string) {
    const token = this.current();
    if (token.type !== "operator" || token.value !== value) return false;
    this.position += 1;
    return true;
  }

  private consumePunctuation(value: string) {
    const token = this.current();
    if (token.type !== "punctuation" || token.value !== value) return false;
    this.position += 1;
    return true;
  }

  private expect(type: ExpressionToken["type"]) {
    if (this.current().type !== type) throw new Error(`Expected ${type}`);
    this.position += 1;
  }

  private expectPunctuation(value: string) {
    if (!this.consumePunctuation(value)) throw new Error(`Expected ${value}`);
  }
}
