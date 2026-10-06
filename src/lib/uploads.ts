import path from "node:path";

/**
 * Fotos e documentos no Supabase Storage (bucket privado "uploads").
 * Os arquivos ficam na nuvem, compartilhados entre todos os computadores,
 * e são servidos pela rota /api/uploads/[name], que busca com a chave do servidor.
 */

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

const BUCKET = "uploads";

function storageEnv(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL/SUPABASE_SERVICE_KEY não configuradas no .env.local.");
  return { url: url.replace(/\/$/, ""), key };
}

declare global {
  var __carosBucketReady: Promise<void> | undefined;
}

/** Garante que o bucket privado existe (roda uma vez por processo). */
function ensureBucket(): Promise<void> {
  return (globalThis.__carosBucketReady ??= (async () => {
    const { url, key } = storageEnv();
    const res = await fetch(`${url}/storage/v1/bucket`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
    });
    // 409 = já existe — ok
    if (!res.ok && res.status !== 409) {
      const body = await res.text();
      if (!/already exists/i.test(body)) throw new Error(`Falha ao preparar o bucket de uploads: ${body}`);
    }
  })());
}

/** Envia um arquivo para a nuvem com nome único e seguro. */
export async function saveUpload(file: File): Promise<{ fileName: string; mime: string; size: number }> {
  await ensureBucket();
  const { url, key } = storageEnv();
  const buf = Buffer.from(await file.arrayBuffer());
  const safeBase = (file.name || "arquivo").replace(/[^\w.\-]+/g, "_").slice(-80);
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBase}`;
  const mime = file.type || contentTypeFor(fileName);

  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${encodeURIComponent(fileName)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": mime },
    body: new Uint8Array(buf),
  });
  if (!res.ok) throw new Error(`Falha ao enviar o arquivo: ${await res.text()}`);
  return { fileName, mime, size: buf.length };
}

/** Baixa um arquivo da nuvem (usado pela rota /api/uploads). */
export async function fetchUpload(fileName: string): Promise<Response> {
  await ensureBucket();
  const { url, key } = storageEnv();
  return fetch(`${url}/storage/v1/object/${BUCKET}/${encodeURIComponent(fileName)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
}

export function deleteUpload(fileName: string | null | undefined): void {
  if (!fileName) return;
  // melhor esforço, sem bloquear a ação que chamou
  void (async () => {
    try {
      const { url, key } = storageEnv();
      await fetch(`${url}/storage/v1/object/${BUCKET}/${encodeURIComponent(path.basename(fileName))}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${key}` },
      });
    } catch {
      // arquivo já não existe — ok
    }
  })();
}

export function uploadUrl(fileName: string): string {
  return `/api/uploads/${encodeURIComponent(fileName)}`;
}
