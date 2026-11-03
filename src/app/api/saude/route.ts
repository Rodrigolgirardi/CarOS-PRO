import { get } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Checagem rápida do banco: diz se conectou e, se não, o motivo (sem expor senha/endereço). */
export async function GET() {
  const t0 = Date.now();
  try {
    await get("SELECT 1 AS ok");
    return Response.json({ ok: true, ms: Date.now() - t0 });
  } catch (e) {
    const err = e as { message?: string; code?: string };
    const message = (err.message ?? String(e)).replace(/postgres(ql)?:\/\/\S+/gi, "[url]");
    return Response.json({ ok: false, code: err.code ?? null, message, ms: Date.now() - t0 }, { status: 503 });
  }
}
