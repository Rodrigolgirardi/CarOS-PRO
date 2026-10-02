"use server";

import { revalidatePath } from "next/cache";
import { all, run, tx } from "../db";
import { deleteUpload } from "../uploads";
import { ok } from "./util";

/** Remove todos os dados de demonstração (e tudo que estiver ligado a eles). */
export async function clearDemoData(): Promise<{ ok: boolean; message?: string }> {
  const files = all<{ file_name: string }>(
    `SELECT file_name FROM documents
     WHERE is_demo = 1
        OR vehicle_id  IN (SELECT id FROM vehicles  WHERE is_demo = 1)
        OR customer_id IN (SELECT id FROM customers WHERE is_demo = 1)`
  );
  const photos = all<{ photo: string }>("SELECT photo FROM vehicles WHERE is_demo = 1 AND photo IS NOT NULL");

  tx(() => {
    run("DELETE FROM vehicles WHERE is_demo = 1"); // cascade: compras, custos, tarefas, docs, negociações, eventos
    run("DELETE FROM customers WHERE is_demo = 1");
    for (const t of ["payables", "receivables", "events", "documents", "deals", "costs", "tasks", "purchases"]) {
      run(`DELETE FROM ${t} WHERE is_demo = 1`);
    }
  });

  for (const f of files) deleteUpload(f.file_name);
  for (const p of photos) deleteUpload(p.photo);

  revalidatePath("/", "layout");
  return ok("Dados de exemplo removidos. O sistema está pronto para os seus dados.");
}
