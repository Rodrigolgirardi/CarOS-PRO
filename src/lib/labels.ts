import type {
  CostCategory,
  CustomerKind,
  CustomerStatus,
  DealStage,
  DocumentType,
  EventType,
  TaskGroup,
  TaskType,
  VehicleLaudo,
  VehicleLeilao,
  VehicleStatus,
} from "./types";

/** Tons visuais usados pelos badges (poucos, discretos). */
export type Tone = "zinc" | "blue" | "emerald" | "amber" | "violet" | "red" | "teal";

/** Bolinha colorida das timelines, por tom. */
export const DOT_CLASS: Record<Tone, string> = {
  zinc: "bg-zinc-300",
  blue: "bg-blue-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  violet: "bg-violet-400",
  red: "bg-red-400",
  teal: "bg-teal-400",
};

export const VEHICLE_STATUS: Record<VehicleStatus, { label: string; tone: Tone }> = {
  para_cadastrar: { label: "Cadastrar", tone: "blue" },
  para_arrumar: { label: "Arrumar", tone: "amber" },
  cadastrado: { label: "Pronto", tone: "emerald" }, // carro ok, pronto para venda
  vendido: { label: "Vendido", tone: "zinc" },
};

export const VEHICLE_LAUDO: Record<VehicleLaudo, string> = {
  aprovado_sem: "Aprovado sem apontamento",
  aprovado_com: "Aprovado com apontamento",
};

export const VEHICLE_LEILAO: Record<VehicleLeilao, string> = {
  nao: "Não",
  pequena_monta: "Sim — pequena monta",
  media_monta: "Sim — média monta",
  financeira: "Sim — financeira",
  outros: "Sim — outros",
};

export const DEAL_STAGE: Record<DealStage, { label: string; tone: Tone }> = {
  interessado: { label: "Interessado", tone: "zinc" },
  proposta: { label: "Proposta", tone: "blue" },
  reservado: { label: "Reservado", tone: "violet" },
  vendido: { label: "Vendido", tone: "emerald" },
  entregue: { label: "Entregue", tone: "teal" },
  perdido: { label: "Perdida", tone: "red" },
};

export const CUSTOMER_KIND: Record<CustomerKind, { label: string; tone: Tone }> = {
  comprador: { label: "Comprador", tone: "emerald" },
  consignante: { label: "Consignante", tone: "violet" },
};

export const CUSTOMER_STATUS: Record<CustomerStatus, { label: string; tone: Tone }> = {
  novo: { label: "Novo", tone: "zinc" },
  contato: { label: "Contato", tone: "blue" },
  interessado: { label: "Interessado", tone: "teal" },
  negociacao: { label: "Negociação", tone: "violet" },
  vendido: { label: "Vendido", tone: "emerald" },
  perdido: { label: "Perdido", tone: "red" },
};

export const COST_CATEGORY: Record<CostCategory, string> = {
  frete: "Frete",
  transferencia: "Transferência",
  despachante: "Despachante",
  manutencao: "Manutenção",
  pecas: "Peças",
  estetica: "Estética",
  lavagem: "Lavagem",
  combustivel: "Combustível",
  anuncios: "Anúncios",
  comissao: "Comissão",
  outros: "Outros",
};

export const TASK_TYPE: Record<TaskType, { label: string; group: TaskGroup }> = {
  revisao: { label: "Revisão", group: "preparacao" },
  manutencao: { label: "Manutenção", group: "manutencao" },
  higienizacao: { label: "Higienização", group: "preparacao" },
  estetica: { label: "Estética", group: "preparacao" },
  fotos: { label: "Fotos", group: "fotos" },
  anuncio: { label: "Anúncio", group: "anuncio" },
  documentacao: { label: "Documentação", group: "documentacao" },
  transferencia: { label: "Transferência", group: "documentacao" },
  outro: { label: "Outra", group: "outros" },
};

/** Ordem do checklist padrão criado para cada veículo comprado. */
export const DEFAULT_CHECKLIST: TaskType[] = [
  "revisao",
  "manutencao",
  "higienizacao",
  "estetica",
  "fotos",
  "anuncio",
  "documentacao",
  "transferencia",
];

export const TASK_GROUP: Record<TaskGroup, string> = {
  preparacao: "Preparação",
  manutencao: "Manutenção",
  documentacao: "Documentação",
  fotos: "Fotos",
  anuncio: "Anúncio",
  outros: "Outras",
};

/** Ao concluir uma tarefa com custo, o custo entra nesta categoria. */
export const TASK_COST_CATEGORY: Record<TaskType, CostCategory> = {
  revisao: "manutencao",
  manutencao: "manutencao",
  higienizacao: "lavagem",
  estetica: "estetica",
  fotos: "outros",
  anuncio: "anuncios",
  documentacao: "despachante",
  transferencia: "transferencia",
  outro: "outros",
};

export const DOC_TYPE: Record<DocumentType, string> = {
  crlv: "CRLV",
  atpve: "ATPV-e",
  contrato: "Contrato",
  termo_consignacao: "Termo de consignação",
  nota_fiscal: "Nota fiscal",
  laudo: "Laudo",
  comprovante: "Comprovante",
  outro: "Outro",
};

export const EVENT_META: Record<EventType, { label: string; tone: Tone }> = {
  compra: { label: "Compra", tone: "blue" },
  custo: { label: "Custo", tone: "amber" },
  preco: { label: "Preço", tone: "violet" },
  status: { label: "Status", tone: "zinc" },
  tarefa: { label: "Tarefa", tone: "teal" },
  proposta: { label: "Proposta", tone: "blue" },
  reserva: { label: "Reserva", tone: "violet" },
  venda: { label: "Venda", tone: "emerald" },
  entrega: { label: "Entrega", tone: "teal" },
  recebimento: { label: "Recebimento", tone: "emerald" },
  pagamento: { label: "Pagamento", tone: "red" },
  contato: { label: "Contato", tone: "zinc" },
  documento: { label: "Documento", tone: "zinc" },
  outro: { label: "Evento", tone: "zinc" },
};

export const PAYMENT_METHODS = [
  "PIX",
  "Dinheiro",
  "Transferência",
  "Cartão",
  "Financiamento",
  "Entrada + financiamento",
  "Troca + complemento",
  "Outro",
];

export const PAYABLE_CATEGORIES = [
  "Veículos",
  "Documentação",
  "Oficina",
  "Estética",
  "Marketing",
  "Aluguel",
  "Impostos",
  "Salários",
  "Outros",
];

export const SALE_CHANNELS = [
  "Facebook Marketplace",
  "OLX",
  "Webmotors",
  "Site Próprio",
  "Loja Física",
  "GoGarage",
  "Indicação",
  "Outros",
];

/** Plataformas de anúncio (checklist "Plataformas" da ficha do veículo). */
export const AD_PLATFORMS = [
  "Facebook",
  "OLX",
  "Webmotors",
  "Mercado Livre",
  "GoGarage",
  "Site Próprio",
  "Outros",
];

export const FUEL_OPTIONS = ["Flex", "Gasolina", "Diesel", "Híbrido", "Elétrico"];
export const TRANSMISSION_OPTIONS = ["Automático", "Manual", "CVT", "Automatizado"];

/**
 * Tipos de "Adicionar entrada" — só dinheiro que entra fora da venda de
 * veículos (a venda já lança o recebimento pelo botão Venda). `rule` aponta
 * a regra de comissão sugerida; aporte e empréstimo não têm comissão.
 */
export const INCOME_TYPES: {
  key: string;
  label: string;
  rule: string | null;
  commission: boolean;
  example: string;
}[] = [
  { key: "financiamento", label: "Financiamento", rule: "financiamento", commission: true, example: "Retorno do banco — Fiat Toro" },
  { key: "despachante", label: "Despachante", rule: "documentacao", commission: true, example: "Transferência — Honda CG" },
  { key: "aporte", label: "Aporte de capital", rule: null, commission: false, example: "Aporte dos sócios" },
  { key: "emprestimo", label: "Empréstimo", rule: null, commission: false, example: "Banco X — 12 parcelas" },
  { key: "outros", label: "Outros", rule: "outros", commission: true, example: "Descreva a entrada" },
];
