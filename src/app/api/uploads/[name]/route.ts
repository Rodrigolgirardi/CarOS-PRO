import path from "node:path";
import { contentTypeFor, fetchUpload } from "@/lib/uploads";

/** Serve os arquivos do Supabase Storage (fotos e documentos). */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const fileName = path.basename(decodeURIComponent(name)); // nunca sai do bucket de uploads
  const upstream = await fetchUpload(fileName);
  if (!upstream.ok) return new Response("Arquivo não encontrado", { status: 404 });

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? contentTypeFor(fileName),
      "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
