import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  AddContactButton,
  CustomerEditButton,
  CustomerStatusSelect,
} from "@/components/customers/customer-dialogs";
import { NewDealButton } from "@/components/deals/new-deal-button";
import { UploadDocButton } from "@/components/documents/upload-doc-button";
import { Badge, CustomerStatusBadge, DealStageBadge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm";
import { deleteCustomer } from "@/lib/actions/customers";
import { brl, fmtDate } from "@/lib/format";
import { DOT_CLASS, EVENT_META } from "@/lib/labels";
import { customerOptions, getCustomer } from "@/lib/queries/customers";
import { dealsForCustomer } from "@/lib/queries/deals";
import { docsForCustomer } from "@/lib/queries/documents";
import { eventsForCustomer } from "@/lib/queries/events";
import { vehicleOptions } from "@/lib/queries/vehicles";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomer(Number(id));
  return { title: customer?.name ?? "Cliente" };
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3">
        <h3 className="text-[13px] font-semibold text-zinc-900">{title}</h3>
        {action}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const deals = await dealsForCustomer(id);
  const events = await eventsForCustomer(id);
  const docs = await docsForCustomer(id);
  const vehicles = await vehicleOptions();
  const customers = await customerOptions();

  const purchases = deals.filter((d) => d.stage === "vendido" || d.stage === "entregue");
  const active = deals.filter((d) => ["interessado", "proposta", "reservado"].includes(d.stage));

  return (
    <>
      <PageHeader
        backHref="/clientes"
        backLabel="Clientes"
        title={
          <span className="flex items-center gap-3">
            {customer.name}
            <CustomerStatusBadge status={customer.status} />
          </span>
        }
        description={[customer.city, customer.phone].filter(Boolean).join(" · ") || undefined}
        actions={
          <>
            <CustomerStatusSelect id={id} status={customer.status} />
            <AddContactButton customerId={id} />
            <NewDealButton vehicles={vehicles} customers={customers} label="Negociação" />
            <CustomerEditButton customer={customer} />
            <ConfirmButton
              action={deleteCustomer.bind(null, id)}
              title={`Excluir ${customer.name}?`}
              description="Negociações em aberto e o histórico deste cliente serão removidos. Clientes com vendas registradas não podem ser excluídos."
              redirectTo="/clientes"
              className="size-8 p-0 text-zinc-400 hover:text-red-600"
              variant="secondary"
              size="md"
            >
              <Trash2 size={14} />
            </ConfirmButton>
          </>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[320px_1fr]">
        <div className="space-y-5">
          <Card title="Dados">
            <dl className="space-y-2 text-[13px]">
              {[
                ["CPF/CNPJ", customer.cpf_cnpj],
                ["Telefone", customer.phone],
                ["E-mail", customer.email],
                ["Cidade", customer.city],
                ["Cliente desde", fmtDate(customer.created_at.slice(0, 10))],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between gap-4">
                  <dt className="text-zinc-500">{label}</dt>
                  <dd className="text-right font-medium text-zinc-900">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
            {customer.notes && (
              <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-[13px] leading-relaxed text-zinc-600">
                {customer.notes}
              </p>
            )}
          </Card>

          <Card title="Documentos" action={<UploadDocButton customerId={id} vehicles={vehicles} />}>
            {docs.length === 0 ? (
              <p className="text-[13px] text-zinc-400">Nenhum documento.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {docs.map((d) => (
                  <li key={d.id} className="py-2 first:pt-0 last:pb-0">
                    <a
                      href={`/api/uploads/${encodeURIComponent(d.file_name)}`}
                      target="_blank"
                      className="flex items-center gap-2 text-[13px] font-medium text-zinc-800 underline-offset-2 hover:underline"
                    >
                      <FileText size={13} className="shrink-0 text-zinc-300" />
                      <span className="truncate">{d.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Negociações e interesses">
            {deals.length === 0 ? (
              <p className="text-[13px] text-zinc-400">
                Nenhuma negociação — use “Negociação” acima para registrar interesse em um veículo.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {[...active, ...deals.filter((d) => !active.includes(d))].map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Link
                        href={`/veiculos/${d.vehicle_id}`}
                        className="truncate text-[13px] font-medium text-zinc-900 underline-offset-2 hover:underline"
                      >
                        {d.vehicle_label}
                      </Link>
                      <DealStageBadge stage={d.stage} />
                    </div>
                    <span className="shrink-0 text-[13px] tabular-nums text-zinc-500">
                      {d.sale_price != null ? brl(d.sale_price) : d.proposed_price != null ? brl(d.proposed_price) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {purchases.length > 0 && (
            <Card title="Compras realizadas">
              <ul className="divide-y divide-zinc-100">
                {purchases.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <Link
                        href={`/veiculos/${d.vehicle_id}`}
                        className="block truncate text-[13px] font-medium text-zinc-900 underline-offset-2 hover:underline"
                      >
                        {d.vehicle_label}
                      </Link>
                      <p className="text-xs text-zinc-400">
                        {fmtDate(d.sold_date)}
                        {d.pending > 0 && <span className="ml-2 font-medium text-amber-600">{brl(d.pending)} pendente</span>}
                      </p>
                    </div>
                    <span className="shrink-0 text-[13px] font-semibold tabular-nums text-zinc-900">
                      {brl(d.sale_price)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="Histórico de contatos e eventos">
            {events.length === 0 ? (
              <p className="text-[13px] text-zinc-400">Nada registrado ainda.</p>
            ) : (
              <ol>
                {events.map((e, i) => {
                  const meta = EVENT_META[e.type] ?? EVENT_META.outro;
                  return (
                    <li key={e.id} className="relative flex gap-3.5 pb-4 last:pb-0">
                      {i < events.length - 1 && (
                        <span className="absolute left-[5px] top-4 h-full w-px bg-zinc-100" aria-hidden />
                      )}
                      <span
                        className={`relative mt-[5px] size-[11px] shrink-0 rounded-full border-2 border-white ring-1 ring-zinc-200 ${DOT_CLASS[meta.tone]}`}
                      />
                      <div className="flex min-w-0 flex-1 items-baseline justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[13px] text-zinc-800">{e.description}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
                            <Badge tone={meta.tone} className="px-1.5 py-0 text-[10px]">
                              {meta.label}
                            </Badge>
                            {fmtDate(e.date)}
                            {e.vehicle_label && <span className="truncate">· {e.vehicle_label}</span>}
                          </p>
                        </div>
                        {e.amount != null && (
                          <span className="shrink-0 text-[13px] font-medium tabular-nums text-zinc-600">
                            {brl(e.amount)}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
