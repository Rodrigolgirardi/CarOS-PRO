import { redirect } from "next/navigation";

/** Clientes agora vivem em Leads (interessados) e Consignantes. */
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  redirect(status === "consignantes" ? "/vendas?tab=consignantes" : "/vendas");
}
