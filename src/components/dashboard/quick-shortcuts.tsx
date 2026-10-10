import { Plus } from "lucide-react";
import { NewDealButton } from "@/components/deals/new-deal-button";
import { UploadDocButton } from "@/components/documents/upload-doc-button";
import { NewTaskButton } from "@/components/my-tasks/my-tasks";
import { AddIncomeButton } from "@/components/finance/add-income-button";
import { PlateLookupButton } from "@/components/plate-cache/plate-lookup-button";
import { LinkButton } from "@/components/ui/button";
import { AddExpenseButton } from "@/components/vehicles/add-expense-button";
import { QuickSaleButton } from "@/components/vehicles/quick-sale-button";
import { commissionRule, listCommissionRules } from "@/lib/queries/commissions";
import { listCustomTypes } from "@/lib/queries/custom-types";
import { customerOptions } from "@/lib/queries/customers";
import { sellerOptions } from "@/lib/queries/sellers";
import { vehicleOptions } from "@/lib/queries/vehicles";

/** "Atalhos rápidos" do Dashboard (desktop): os mesmos botões da tela de Veículos. */
export async function QuickShortcuts() {
  const [vehicles, allVehicles, sellers, customers, rules, saleCommission, saidas, entradas] = await Promise.all([
    vehicleOptions(),
    vehicleOptions({ includeSold: true }), // documento pode ser de carro já vendido (transferência)
    sellerOptions(),
    customerOptions(),
    listCommissionRules(),
    commissionRule("venda_carro"),
    listCustomTypes("saida"),
    listCustomTypes("entrada"),
  ]);

  return (
    <section className="mb-7">
      <h2 className="mb-2.5 text-[13px] font-semibold text-zinc-900">Atalhos rápidos</h2>
      <div className="flex flex-wrap items-center gap-2">
        <LinkButton href="/compras/nova" variant="primary">
          <Plus size={14} />
          Adicionar veículo
        </LinkButton>
        <AddExpenseButton vehicles={vehicles} extraCategories={saidas.map((t) => t.label)} />
        <AddIncomeButton
          customers={customers}
          sellers={sellers}
          rules={rules}
          extraTypes={entradas.map((t) => t.label)}
        />
        <PlateLookupButton />
        <NewTaskButton vehicles={vehicles} variant="secondary" />
        <UploadDocButton vehicles={allVehicles} customers={customers} shortcut />
        <NewDealButton vehicles={vehicles} customers={customers} label="Novo lead" variant="secondary" />
        <QuickSaleButton vehicles={vehicles} sellers={sellers} customers={customers} defaultCommission={saleCommission} />
      </div>
    </section>
  );
}
