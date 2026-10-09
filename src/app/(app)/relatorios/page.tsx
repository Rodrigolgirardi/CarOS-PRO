import { redirect } from "next/navigation";

/** Os relatórios agora vivem em Vendas → aba Relatório. */
export default function ReportsPage() {
  redirect("/vendas?tab=relatorio");
}
