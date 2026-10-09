import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { deleteCustomType } from "@/lib/actions/custom-types";
import { COST_CATEGORY, INCOME_TYPES } from "@/lib/labels";
import { listCustomTypes, type CustomType } from "@/lib/queries/custom-types";
import { ConfirmButton } from "@/components/ui/confirm";
import { CustomTypeForm } from "./custom-type-form";

function TypeCard({
  kind,
  title,
  hint,
  icon: Icon,
  iconClass,
  builtIn,
  custom,
}: {
  kind: "saida" | "entrada";
  title: string;
  hint: string;
  icon: typeof ArrowUpRight;
  iconClass: string;
  builtIn: string[];
  custom: CustomType[];
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50/60 px-4 py-2.5">
        <span className={`grid size-6 place-items-center rounded-md ${iconClass}`}>
          <Icon size={14} />
        </span>
        <h2 className="text-[13px] font-semibold text-zinc-900">{title}</h2>
      </div>
      <div className="flex-1 space-y-4 px-4 py-4">
        <p className="text-xs text-zinc-500">{hint}</p>
        <CustomTypeForm kind={kind} />

        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Criados por você</p>
          {custom.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-3 text-center text-xs text-zinc-400">
              Nenhum tipo criado ainda.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
              {custom.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                  <span className="truncate text-[13px] font-medium text-zinc-800">{t.label}</span>
                  <ConfirmButton
                    action={deleteCustomType.bind(null, t.id)}
                    title={`Remover o tipo "${t.label}"?`}
                    description="Ele sai da lista dos formulários. Lançamentos antigos continuam com esse nome."
                    confirmLabel="Remover"
                    variant="danger-ghost"
                    className="size-7 p-0"
                  >
                    <Trash2 size={14} />
                  </ConfirmButton>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Já vêm no sistema</p>
          <div className="flex flex-wrap gap-1.5">
            {builtIn.map((label) => (
              <span key={label} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Configurações → Entradas e saídas: criar tipos que aparecem em Adicionar saída / Adicionar entrada. */
export async function CustomTypesPanel() {
  const [saidas, entradas] = await Promise.all([listCustomTypes("saida"), listCustomTypes("entrada")]);
  return (
    <div className="grid max-w-4xl grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <TypeCard
        kind="saida"
        title="Tipos de saída"
        hint="Aparecem em “Adicionar saída” e nos custos de cada veículo."
        icon={ArrowUpRight}
        iconClass="bg-red-50 text-red-600"
        builtIn={Object.values(COST_CATEGORY)}
        custom={saidas}
      />
      <TypeCard
        kind="entrada"
        title="Tipos de entrada"
        hint="Aparecem em “Adicionar entrada”, no campo Recebimento por."
        icon={ArrowDownLeft}
        iconClass="bg-emerald-50 text-emerald-600"
        builtIn={INCOME_TYPES.map((t) => t.label)}
        custom={entradas}
      />
    </div>
  );
}
