import { redirect } from "next/navigation";

// Comissões agora vive junto com Vendedores — link antigo continua funcionando.
export default function CommissionsPage() {
  redirect("/vendedores");
}
