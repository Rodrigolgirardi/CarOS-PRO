import { redirect } from "next/navigation";

/** A ficha do cliente agora vive no lápis, dentro de Leads/Consignantes. */
export default function CustomerPage() {
  redirect("/vendas");
}
