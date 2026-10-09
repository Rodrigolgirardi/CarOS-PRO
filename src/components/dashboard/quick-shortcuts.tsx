import { Plus } from "lucide-react";
import { AddIncomeButton } from "@/components/finance/add-income-button";
import { PlateLookupButton } from "@/components/plate-cache/plate-lookup-button";
import { LinkButton } from "@/components/ui/button";
import { AddExpenseButton } from "@/components/vehicles/add-expense-button";
import { QuickSaleButton } from "@/components/vehicles/quick-sale-button";
import { commissionRule, listCommissionRules } from "@/lib/queries/commissions";
import { customerOptions } from "@/lib/queries/customers";
import { sellerOptions } from "@/lib/queries/sellers";
import { vehicleOptions } from "@/lib/queries/vehicles";

/** "Atalhos rápidos" do Dashboard (desktop): os mesmos botões da tela de Veículos. */
export async function QuickShortcuts() {
  const [vehicles, sellers, customers, rules, saleCommission] = await Promise.all([
    vehicleOptions(),
    sellerOptions(),
    customerOptions(),
    listCommissionRules(),
    commissionRule("venda_carro"),
  ]);

  return (
    <section className="mb-7">
      <h2 className="mb-2.5 text-[13px] font-semibold text-zinc-900">Atalhos rápidos</h2>
      <div className="flex flex-wrap items-center gap-2">
        <LinkButton href="/compras/nova" variant="primary">
          <Plus size={14} />
          Adicionar veículo
        </LinkButton>
        <AddExpenseButton vehicles={vehicles} />
        <AddIncomeButton customers={customers} sellers={sellers} rules={rules} />
        <PlateLookupButton />
        <QuickSaleButton vehicles={vehicles} sellers={sellers} customers={customers} defaultCommission={saleCommission} />
      </div>
    </section>
  );
}
