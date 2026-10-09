import { redirect } from "next/navigation";

/** A lista de compras foi aposentada: o estoque em /veiculos cobre esse papel. */
export default function PurchasesPage() {
  redirect("/veiculos");
}
