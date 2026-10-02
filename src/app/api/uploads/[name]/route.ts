import fs from "node:fs";
import path from "node:path";
import { UPLOADS_DIR } from "@/lib/paths";
import { contentTypeFor } from "@/lib/uploads";

/** Serve arquivos locais de data/uploads (fotos e documentos). */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const fileName = path.basename(decodeURIComponent(name)); // nunca sai da pasta de uploads
  const filePath = path.join(UPLOADS_DIR, fileName);
  if (!fs.existsSync(filePath)) return new Response("Arquivo não encontrado", { status: 404 });

  const buf = fs.readFileSync(filePath);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": contentTypeFor(fileName),
      "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
