import { all } from "../db";

export type CustomTypeKind = "saida" | "entrada";

export interface CustomType {
  id: number;
  kind: CustomTypeKind;
  label: string;
  created_at: string;
}

/** Tipos criados em Configurações (saída = categoria de custo do carro; entrada = recebimento avulso). */
export async function listCustomTypes(kind: CustomTypeKind): Promise<CustomType[]> {
  return all<CustomType>("SELECT * FROM custom_types WHERE kind = ? ORDER BY lower(label)", kind);
}

export interface FeedbackRow {
  id: number;
  message: string;
  created_at: string;
}

export async function listFeedback(): Promise<FeedbackRow[]> {
  return all<FeedbackRow>("SELECT * FROM feedback ORDER BY id DESC");
}
