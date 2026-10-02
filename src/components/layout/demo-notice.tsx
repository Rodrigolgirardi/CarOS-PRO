import { hasDemoData } from "@/lib/db";
import { ClearDemoButton } from "./clear-demo-button";

/** Aviso fixo na sidebar enquanto houver dados de demonstração. */
export function DemoNotice() {
  if (!hasDemoData()) return null;
  return (
    <div className="rounded-lg border border-amber-200/70 bg-amber-50/80 p-3">
      <p className="text-xs font-semibold text-amber-800">Dados de exemplo</p>
      <p className="mt-1 text-[11px] leading-relaxed text-amber-700/90">
        Você está explorando o CarOS com dados fictícios.
      </p>
      <ClearDemoButton />
    </div>
  );
}
