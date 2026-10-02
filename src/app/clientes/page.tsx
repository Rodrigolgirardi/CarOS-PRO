import Link from "next/link";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerCreateButton } from "@/components/customers/customer-dialogs";
import { CustomerStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Chips } from "@/components/ui/tabs";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { fmtDateShort } from "@/lib/format";
import { CUSTOMER_STATUS } from "@/lib/labels";
import { customerCounts, listCustomers } from "@/lib/queries/customers";
import type { CustomerStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clientes" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status && status in CUSTOMER_STATUS ? (status as CustomerStatus) : "todos";
  const customers = listCustomers(filter === "todos" ? undefined : filter);
  const counts = customerCounts();

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Quem compra, quem está negociando e quem pode voltar."
        actions={<CustomerCreateButton />}
      />

      <Chips
        className="mb-4"
        activeKey={filter}
        items={[
          { key: "todos", label: "Todos", count: counts.todos, href: "/clientes" },
          ...(Object.keys(CUSTOMER_STATUS) as CustomerStatus[]).map((s) => ({
            key: s,
            label: CUSTOMER_STATUS[s].label,
            count: counts[s] ?? 0,
            href: `/clientes?status=${s}`,
          })),
        ]}
      />

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={filter === "todos" ? "Nenhum cliente cadastrado" : "Nenhum cliente neste status"}
          description="Cadastre interessados para ligar as negociações aos veículos."
          action={filter === "todos" ? <CustomerCreateButton label="Cadastrar cliente" /> : undefined}
        />
      ) : (
        <Table>
          <THead>
            <Th>Cliente</Th>
            <Th>Telefone</Th>
            <Th>E-mail</Th>
            <Th>Status</Th>
            <Th>Interesse atual</Th>
            <Th right>Compras</Th>
            <Th right>Última atividade</Th>
          </THead>
          <TBody>
            {customers.map((c) => (
              <Tr key={c.id}>
                <Td className="max-w-[220px]">
                  <Link href={`/clientes/${c.id}`} className="block min-w-0">
                    <span className="block truncate font-medium text-zinc-900 group-hover:underline group-hover:underline-offset-2">
                      {c.name}
                    </span>
                    <span className="block truncate text-xs text-zinc-400">{c.city ?? "—"}</span>
                  </Link>
                </Td>
                <Td className="text-zinc-600">{c.phone ?? "—"}</Td>
                <Td className="max-w-[200px] truncate text-zinc-500">{c.email ?? "—"}</Td>
                <Td>
                  <CustomerStatusBadge status={c.status} />
                </Td>
                <Td className="max-w-[200px] truncate text-zinc-600">{c.active_interest ?? "—"}</Td>
                <Td right className="text-zinc-600">
                  {c.purchases_count || "—"}
                </Td>
                <Td right className="text-zinc-500">
                  {c.last_activity ? fmtDateShort(c.last_activity) : "—"}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
