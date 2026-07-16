import {
  CharacterPresetTemplate,
  isCharacterPresetTemplate,
  isRawPreset,
  RawPreset,
} from "@/types/preset";
import { stripSensitivePresetKeys } from "@/lib/preset-sanitizer";
import { serializePresetData } from "@/lib/ai/generated-yaml";
import type { PresetModel } from "@/lib/database";
import {
  createPreset,
  getPresetDisplayName,
} from "@/lib/preset-store";
import { load } from "js-yaml";

const PRESET_UPLOAD_API_URL =
  "https://api-chatluna-preset-market.dingyi222666.top/upload_preset";
const DEFAULT_UPLOAD_TOKEN_ENCODED = "Y2hhdGx1bmE=";

export const exportPreset = (preset: PresetModel) => {
  const blob = new Blob([makeYaml(preset)], {
    type: "application/yaml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const name =
    preset.type === "character"
      ? (preset.preset as CharacterPresetTemplate).name
      : (preset.preset as RawPreset).keywords[0];
  a.download = `${name}.yml`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export async function importPreset(
  preset: string | RawPreset | CharacterPresetTemplate,
) {
  const rawPreset =
    typeof preset === "string"
      ? (load(preset) as RawPreset | CharacterPresetTemplate)
      : preset;

  if (isRawPreset(rawPreset)) {
    const sanitized = stripSensitivePresetKeys(rawPreset);
    return await createPreset({
      name: sanitized.keywords[0],
      type: "main",
      preset: sanitized,
    });
  }

  if (isCharacterPresetTemplate(rawPreset)) {
    const sanitized = stripSensitivePresetKeys(rawPreset);
    return await createPreset({
      name: sanitized.name,
      type: "character",
      preset: sanitized,
    });
  }

  throw new Error("Invalid preset");
}

export function makeYaml(preset: PresetModel) {
  return serializePresetData(preset.preset);
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
