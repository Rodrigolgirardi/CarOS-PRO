import { redirect } from "next/navigation";

/** A lista de clientes agora vive em Vendas/Leads → aba Clientes. */
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  redirect(`/vendas?tab=clientes${status ? `&status=${status}` : ""}`);
}
