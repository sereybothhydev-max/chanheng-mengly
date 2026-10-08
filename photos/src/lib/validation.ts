/**
 * File validation shared by the browser (instant feedback) and the server
 * (the real gatekeeper — never trust the browser alone).
 */
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, UPLOAD_LIMITS } from "./config";
import { kn } from "./khmer";

export type MediaKind = "image" | "video";

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  qt: "video/quicktime",
  webm: "video/webm",
};

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

/**
 * Some phones/browsers report an empty MIME type (common with iPhone HEIC
 * files on Windows/Android). Fall back to the file extension.
 */
export function resolveMimeType(name: string, type: string): string {
  const t = (type || "").toLowerCase();
  if (MIME_TO_EXT[t]) return t;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? t;
}

export function kindOf(mime: string): MediaKind | null {
  if ((ALLOWED_IMAGE_TYPES as readonly string[]).includes(mime)) return "image";
  if ((ALLOWED_VIDEO_TYPES as readonly string[]).includes(mime)) return "video";
  return null;
}

export function extensionFor(mime: string): string {
  return MIME_TO_EXT[mime] ?? "bin";
}

export type ValidationResult =
  | { ok: true; mime: string; kind: MediaKind }
  | { ok: false; error: string };

export function validateFile(meta: { name: string; type: string; size: number }): ValidationResult {
  const mime = resolveMimeType(meta.name, meta.type);
  const kind = kindOf(mime);
  if (!kind) return { ok: false, error: `“${meta.name}” មិនមែនជារូបថត ឬវីដេអូដែលយើងអាចទទួលបានទេ។` };
  if (!Number.isFinite(meta.size) || meta.size <= 0) {
    return { ok: false, error: `“${meta.name}” ហាក់ដូចជាឯកសារទទេ។` };
  }
  const max = kind === "image" ? UPLOAD_LIMITS.maxImageBytes : UPLOAD_LIMITS.maxVideoBytes;
  if (meta.size > max) {
    return {
      ok: false,
      error: `“${meta.name}” មានទំហំ ${formatBytes(meta.size)} — ${kind === "image" ? "រូបថត" : "វីដេអូ"}អនុញ្ញាតត្រឹម ${formatBytes(max)}។`,
    };
  }
  return { ok: true, mime, kind };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${kn(bytes)} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${kn(value.toFixed(value >= 10 ? 0 : 1))} ${units[i]}`;
}

/** Trim, remove control characters, collapse whitespace, clamp length. */
export function cleanText(input: unknown, max: number): string | null {
  if (typeof input !== "string") return null;
  const s = input
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
  return s.length ? s : null;
}
