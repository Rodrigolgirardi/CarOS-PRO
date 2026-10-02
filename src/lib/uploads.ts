import fs from "node:fs";
import path from "node:path";
import { UPLOADS_DIR } from "./paths";

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "text/xml",
  ".csv": "text/csv",
};

export function contentTypeFor(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

/** Salva um arquivo enviado em data/uploads com nome único e seguro. */
export async function saveUpload(file: File): Promise<{ fileName: string; mime: string; size: number }> {
  const buf = Buffer.from(await file.arrayBuffer());
  const safeBase = (file.name || "arquivo").replace(/[^\w.\-]+/g, "_").slice(-80);
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBase}`;
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOADS_DIR, fileName), buf);
  return { fileName, mime: file.type || contentTypeFor(fileName), size: buf.length };
}

export function deleteUpload(fileName: string | null | undefined): void {
  if (!fileName) return;
  const p = path.join(UPLOADS_DIR, path.basename(fileName));
  try {
    fs.unlinkSync(p);
  } catch {
    // arquivo já não existe — ok
  }
}

export function uploadUrl(fileName: string): string {
  return `/api/uploads/${encodeURIComponent(fileName)}`;
}
