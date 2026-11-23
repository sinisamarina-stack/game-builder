import { clamp } from "@/engine/math";
import { getTemplate } from "./registry";
import type { AnyGameTemplate, GameSettings } from "./types";

/** A user's game: a template plus their settings. This is what gets saved, exported and shared. */
export interface GameDefinition {
  id: string;
  name: string;
  templateId: string;
  settings: GameSettings;
  updatedAt: number;
}

const COLOR = /^#[0-9a-f]{6}$/i;

export function newId() {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export function createDefinition(template: AnyGameTemplate): GameDefinition {
  return {
    id: newId(),
    name: `My ${template.name}`,
    templateId: template.id,
    settings: { ...template.defaults },
    updatedAt: Date.now(),
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Keeps only known settings with valid values; anything else falls back to the template default. */
export function sanitizeSettings(template: AnyGameTemplate, raw: unknown): GameSettings {
  const input = isRecord(raw) ? raw : {};
  const settings: GameSettings = { ...template.defaults };
  for (const param of template.params) {
    const value = input[param.key];
    if (param.type === "number" && typeof value === "number" && Number.isFinite(value)) {
      settings[param.key] = clamp(value, param.min, param.max);
    } else if (param.type === "color" && typeof value === "string" && COLOR.test(value)) {
      settings[param.key] = value;
    } else if (param.type === "select" && param.options.some((option) => option.value === value)) {
      settings[param.key] = value as string;
    } else if (param.type === "boolean" && typeof value === "boolean") {
      settings[param.key] = value;
    }
  }
  return settings;
}

/** Validates untrusted data (localStorage, imported files, share links). */
export function sanitizeDefinition(raw: unknown): GameDefinition | null {
  if (!isRecord(raw) || typeof raw.templateId !== "string") return null;
  const template = getTemplate(raw.templateId);
  if (!template) return null;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : newId(),
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.slice(0, 60) : template.name,
    templateId: template.id,
    settings: sanitizeSettings(template, raw.settings),
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : Date.now(),
  };
}

/** Compact base64url encoding for share links (`/play#<code>`). */
export function encodeDefinition(definition: GameDefinition): string {
  const { name, templateId, settings } = definition;
  const bytes = new TextEncoder().encode(JSON.stringify({ name, templateId, settings }));
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeDefinition(code: string): GameDefinition | null {
  try {
    const binary = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return sanitizeDefinition(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}
