import { all, get } from "../db";

export interface CommissionRule {
  key: string;
  label: string;
  amount: number | null; // centavos; null = em branco
  sort: number;
}

export function listCommissionRules(): CommissionRule[] {
  return all<CommissionRule>("SELECT * FROM commission_rules ORDER BY sort, label");
}

export function commissionRule(key: string): number | null {
  return get<{ amount: number | null }>("SELECT amount FROM commission_rules WHERE key = ?", key)?.amount ?? null;
}
