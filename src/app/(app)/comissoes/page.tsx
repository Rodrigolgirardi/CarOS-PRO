import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Comissões agora vive junto com Vendedores — link antigo continua funcionando.
export default function CommissionsPage() {
  redirect("/vendedores");
}
