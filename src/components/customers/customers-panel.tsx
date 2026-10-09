import { Users } from "lucide-react";
import { CustomerCreateButton } from "@/components/customers/customer-dialogs";
import { CustomerExpandRow } from "@/components/customers/customer-expand-row";
import { EmptyState } from "@/components/ui/empty-state";
import { CUSTOMER_STATUS } from "@/lib/labels";
import { listCustomers } from "@/lib/queries/customers";
import type { CustomerStatus } from "@/lib/types";

/** Lista de clientes enxuta: nome, tipo e WhatsApp — o resto fica na ficha (>). */
export async function CustomersPanel({ status }: { status?: string }) {
  const filter =
    status === "consignantes" || status === "compradores"
      ? status
      : status && status in CUSTOMER_STATUS ? (status as CustomerStatus) : "todos";
  const all = await listCustomers(filter === "todos" || filter === "consignantes" || filter === "compradores" ? undefined : filter);
  const customers =
    filter === "consignantes"
      ? all.filter((c) => c.kind === "consignante")
      : filter === "compradores"
        ? all.filter((c) => c.purchases_count > 0) // quem já comprou carro da loja
        : all;

  if (customers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={
          filter === "todos"
            ? "Nenhum cliente cadastrado"
            : filter === "compradores"
              ? "Nenhum comprador ainda"
              : "Nenhum cliente neste status"
        }
        description="Cadastre interessados para ligar as negociações aos veículos."
        action={filter === "todos" ? <CustomerCreateButton label="Cadastrar cliente" /> : undefined}
      />
    );
  }

  return (
    <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:mx-auto lg:max-w-5xl">
      {customers.map((c) => (
        <CustomerExpandRow key={c.id} customer={c} consignorView={filter === "consignantes"} buyerView={filter === "compradores"} />
      ))}
    </div>
  );
}
