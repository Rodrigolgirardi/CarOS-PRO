import { all } from "../db";
import type { Seller } from "../types";

export interface SellerRow extends Seller {
  sales_count: number; // vendas registradas com este vendedor
  commission_total: number; // soma das comissões dessas vendas
}

export async function listSellers(): Promise<SellerRow[]> {
  return all<SellerRow>(
    `SELECT s.*, COUNT(d.id) AS sales_count, COALESCE(SUM(d.commission), 0) AS commission_total
     FROM sellers s
     LEFT JOIN deals d ON d.seller_id = s.id AND d.stage IN ('vendido', 'entregue')
     GROUP BY s.id
     ORDER BY s.name`
  );
}

export async function sellerOptions(): Promise<Seller[]> {
  return all<Seller>("SELECT * FROM sellers ORDER BY name");
}
