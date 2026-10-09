import type { MyTaskPriority } from "@/lib/queries/my-tasks";

/** Prioridade das tarefas: bolinha vermelha, laranja e verde. */
export const PRIORITY: Record<MyTaskPriority, { label: string; dot: string; ring: string }> = {
  urgente: { label: "Urgente", dot: "bg-red-500", ring: "border-red-200 bg-red-50 text-red-700" },
  importante: { label: "Importante", dot: "bg-orange-500", ring: "border-orange-200 bg-orange-50 text-orange-700" },
  afazer: { label: "À fazer", dot: "bg-emerald-500", ring: "border-emerald-200 bg-emerald-50 text-emerald-700" },
};
