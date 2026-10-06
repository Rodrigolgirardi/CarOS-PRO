import { all, get } from "../db";

export interface CommissionRule {
  key: string;
  label: string;
  amount: number | null; // centavos; null = em branco
  sort: number;
}

export async function listCommissionRules(): Promise<CommissionRule[]> {
  return all<CommissionRule>("SELECT * FROM commission_rules ORDER BY sort, label");
}

export async function commissionRule(key: string): Promise<number | null> {
  return (await get<{ amount: number | null }>("SELECT amount FROM commission_rules WHERE key = ?", key))?.amount ?? null;
}
