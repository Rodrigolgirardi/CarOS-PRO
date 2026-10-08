import { redirect } from "next/navigation";

/** O banco de placas agora vive em Configurações → aba Banco de dados. */
export default function PlateDatabasePage() {
  redirect("/configuracoes?tab=banco");
}
