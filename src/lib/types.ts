// Entidades do CarOS. Valores monetários em centavos (integer); datas em ISO (YYYY-MM-DD).

export type VehicleStatus = "para_cadastrar" | "para_arrumar" | "cadastrado" | "vendido";
export type VehicleLaudo = "aprovado_sem" | "aprovado_com";
export type VehicleLeilao = "nao" | "pequena_monta" | "media_monta" | "financeira" | "outros";
export type DealStage = "interessado" | "proposta" | "reservado" | "vendido" | "entregue" | "perdido";
export type CustomerStatus = "novo" | "contato" | "interessado" | "negociacao" | "vendido" | "perdido";
export type CostCategory =
  | "frete"
  | "transferencia"
  | "despachante"
  | "manutencao"
  | "pecas"
  | "estetica"
  | "lavagem"
  | "combustivel"
  | "anuncios"
  | "comissao"
  | "outros";
export type TaskType =
  | "revisao"
  | "manutencao"
  | "higienizacao"
  | "estetica"
  | "fotos"
  | "anuncio"
  | "documentacao"
  | "transferencia"
  | "outro";
export type TaskStatus = "pendente" | "concluida";
export type TaskGroup = "preparacao" | "manutencao" | "documentacao" | "fotos" | "anuncio" | "outros";
export type DocumentType =
  | "crlv"
  | "atpve"
  | "contrato"
  | "termo_consignacao"
  | "nota_fiscal"
  | "laudo"
  | "comprovante"
  | "outro";
export type EventType =
  | "compra"
  | "custo"
  | "preco"
  | "status"
  | "tarefa"
  | "proposta"
  | "reserva"
  | "venda"
  | "entrega"
  | "recebimento"
  | "pagamento"
  | "contato"
  | "documento"
  | "outro";

export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  version: string | null;
  year_fab: number | null;
  year_model: number | null;
  plate: string | null;
  km: number | null;
  color: string | null;
  fuel: string | null;
  transmission: string | null;
  renavam: string | null;
  chassis: string | null;
  laudo: VehicleLaudo | null;
  blindado: number | null; // 1 = sim, 0 = não, null = não informado
  leilao: VehicleLeilao | null;
  fipe_price: number | null; // valor FIPE de referência (centavos), vindo da consulta de placa
  consignado: number; // 1 = carro de terceiro na loja (sem compra, sem saída de caixa)
  consignor: string | null; // dono do carro consignado
  consignor_value: number | null; // repasse combinado com o dono (centavos)
  consignado_date: string | null; // data em que o carro consignado entrou na loja
  origin_cpf: string | null; // CPF de quem vendeu/consignou o carro
  origin_whatsapp: string | null;
  origin_email: string | null;
  status: VehicleStatus;
  sale_price: number | null; // preço de venda anunciado/planejado
  photo: string | null;
  notes: string | null;
  is_demo: number;
  created_at: string;
}

export interface Purchase {
  id: number;
  vehicle_id: number;
  seller: string | null;
  date: string;
  price: number;
  payment_method: string | null;
  notes: string | null;
  is_demo: number;
  created_at: string;
}

export interface Cost {
  id: number;
  vehicle_id: number;
  category: CostCategory;
  description: string | null;
  amount: number;
  date: string;
  is_demo: number;
  created_at: string;
}

export type CustomerKind = "comprador" | "consignante";

export interface Customer {
  id: number;
  name: string;
  cpf_cnpj: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  notes: string | null;
  kind: CustomerKind;
  source: string | null; // canal/marketplace de onde o cliente veio // comprador (compra carro) ou consignante (deixou carro na loja)
  status: CustomerStatus;
  is_demo: number;
  created_at: string;
}

export interface Deal {
  id: number;
  vehicle_id: number;
  customer_id: number;
  stage: DealStage;
  proposed_price: number | null;
  sale_price: number | null;
  down_payment: number | null;
  payment_method: string | null;
  financed_amount: number | null;
  trade_in_desc: string | null;
  trade_in_value: number | null;
  commission: number | null;
  commission_cost_id: number | null;
  seller_id: number | null;
  channel: string | null; // canal da venda (OLX, Webmotors…)
  notes: string | null;
  sold_date: string | null;
  delivered_date: string | null;
  is_demo: number;
  created_at: string;
}

export interface Seller {
  id: number;
  name: string;
  commission_pct: number | null; // % padrão sobre o valor da venda
  commission_fixed: number | null; // ou valor fixo em centavos por venda
  phone: string | null; // WhatsApp
  start_date: string | null; // quando entrou na loja (YYYY-MM-DD)
  created_at: string;
}

export interface Task {
  id: number;
  vehicle_id: number;
  type: TaskType;
  description: string | null;
  assignee: string | null;
  due_date: string | null;
  status: TaskStatus;
  cost: number | null;
  cost_id: number | null;
  done_date: string | null;
  is_demo: number;
  created_at: string;
}

export interface Doc {
  id: number;
  name: string;
  type: DocumentType;
  vehicle_id: number | null;
  customer_id: number | null;
  deal_id: number | null;
  purchase_id: number | null;
  file_name: string;
  mime: string | null;
  size: number | null;
  is_demo: number;
  created_at: string;
}

export interface Payable {
  id: number;
  description: string;
  category: string | null;
  amount: number;
  due_date: string;
  status: "pendente" | "pago";
  paid_date: string | null;
  vehicle_id: number | null;
  is_demo: number;
  created_at: string;
}

export interface Receivable {
  id: number;
  description: string;
  customer_id: number | null;
  deal_id: number | null;
  amount: number;
  due_date: string;
  status: "pendente" | "recebido";
  received_date: string | null;
  is_demo: number;
  created_at: string;
}

export interface Event {
  id: number;
  vehicle_id: number | null;
  customer_id: number | null;
  deal_id: number | null;
  type: EventType;
  description: string;
  amount: number | null;
  date: string;
  is_demo: number;
  created_at: string;
}

// ------------------------------------------------- linhas compostas (queries)

/** Veículo + compra + custos agregados + venda (quando houver). */
export interface VehicleRow extends Vehicle {
  purchase_price: number | null;
  purchase_date: string | null;
  purchase_seller: string | null;
  purchase_payment: string | null;
  purchase_notes: string | null;
  purchase_id: number | null;
  costs_total: number;
  /** nº de plataformas onde o carro está anunciado */
  platforms_count: number;
  platforms_list: string | null; // nomes separados por "|"
  total_cost: number;
  sold_deal_id: number | null;
  sold_price: number | null;
  sold_date: string | null;
  buyer_id: number | null;
  buyer_name: string | null;
}

export interface DealRow extends Deal {
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_city: string | null;
  customer_cpf: string | null;
  customer_status: CustomerStatus;
  customer_kind: CustomerKind;
  customer_notes: string | null;
  customer_source: string | null;
  vehicle_brand: string;
  vehicle_year_fab: number | null;
  vehicle_year_model: number | null;
  vehicle_transmission: string | null;
  vehicle_label: string; // "Honda HR-V EXL"
  vehicle_status: VehicleStatus;
  vehicle_photo: string | null;
  vehicle_plate: string | null;
  vehicle_sale_price: number | null; // preço anunciado
  vehicle_total_cost: number;
  purchase_date: string | null; // data de compra do veículo (p/ dias até vender)
  received: number; // soma de recebíveis recebidos da venda
  pending: number; // soma de recebíveis pendentes
}

export interface TaskRow extends Task {
  vehicle_label: string;
  vehicle_photo: string | null;
  vehicle_status: VehicleStatus;
}

export interface DocRow extends Doc {
  vehicle_label: string | null;
  customer_name: string | null;
}

export interface PayableRow extends Payable {
  vehicle_label: string | null;
}

export interface ReceivableRow extends Receivable {
  customer_name: string | null;
  vehicle_label: string | null;
}

export interface EventRow extends Event {
  vehicle_label: string | null;
  customer_name: string | null;
}

/** Resultado padrão das server actions usadas em formulários. */
export type ActionState = { ok: boolean; message?: string; error?: string } | null;
