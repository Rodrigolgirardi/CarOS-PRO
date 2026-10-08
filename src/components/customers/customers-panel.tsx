import Link from "next/link";
import { Users } from "lucide-react";
import { CustomerCreateButton, CustomerRowActions } from "@/components/customers/customer-dialogs";
import { CustomerStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Chips } from "@/components/ui/tabs";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { fmtDateShort } from "@/lib/format";
import { CUSTOMER_KIND, CUSTOMER_STATUS } from "@/lib/labels";
import { customerCounts, listCustomers } from "@/lib/queries/customers";
import type { CustomerStatus } from "@/lib/types";

/** Lista de clientes — vive dentro da aba Clientes em Vendas/Leads. */
export async function CustomersPanel({ status }: { status?: string }) {
  const filter =
    status === "consignantes" ? "consignantes" : status && status in CUSTOMER_STATUS ? (status as CustomerStatus) : "todos";
  const all = await listCustomers(filter === "todos" || filter === "consignantes" ? undefined : filter);
  const customers = filter === "consignantes" ? all.filter((c) => c.kind === "consignante") : all;
  const counts = await customerCounts();
  const consignantesCount = (await listCustomers(undefined)).filter((c) => c.kind === "consignante").length;
  const href = (status?: string) => `/vendas?tab=clientes${status ? `&status=${status}` : ""}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Chips
          activeKey={filter}
          items={[
            { key: "todos", label: "Todos", count: counts.todos, href: href() },
            ...(["negociacao", "vendido"] as CustomerStatus[]).map((s) => ({
              key: s,
              label: CUSTOMER_STATUS[s].label,
              count: counts[s] ?? 0,
              href: href(s),
            })),
            { key: "consignantes", label: "Consignantes", count: consignantesCount, href: href("consignantes") },
          ]}
        />
        <CustomerCreateButton />
      </div>

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
            <Th />
          </THead>
          <TBody>
            {customers.map((c) => (
              <Tr key={c.id}>
                <Td className="max-w-[220px]">
                  <Link href={`/clientes/${c.id}`} className="block min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-medium text-zinc-900 group-hover:underline group-hover:underline-offset-2">
                        {c.name}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          c.kind === "consignante" ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {CUSTOMER_KIND[c.kind].label}
                      </span>
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
                <Td className="w-20">
                  <CustomerRowActions customer={c} />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
