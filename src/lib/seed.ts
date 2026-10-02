import type { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { UPLOADS_DIR } from "./paths";
import { makeDemoPdf } from "./pdf";
import { addDaysISO, monthStartISO, todayISO } from "./format";
import { COST_CATEGORY, DEFAULT_CHECKLIST } from "./labels";
import type { CostCategory, TaskType } from "./types";

/**
 * Dados de demonstração (is_demo = 1 em tudo), com datas relativas a hoje,
 * para que dashboard, financeiro e relatórios nasçam com números reais.
 * Removíveis de uma vez em "Limpar dados de exemplo".
 */
export function seedDemo(db: DatabaseSync): void {
  const today = todayISO();
  const d = (n: number) => addDaysISO(today, -n); // n dias atrás
  const inD = (n: number) => addDaysISO(today, n); // daqui a n dias
  const monthStart = monthStartISO();
  /** Garante que a data caia dentro do mês atual (vendas "deste mês"). */
  const inMonth = (iso: string) => (iso < monthStart ? monthStart : iso);
  const notFuture = (iso: string) => (iso > today ? today : iso);
  const R = (reais: number) => Math.round(reais * 100); // reais → centavos

  const q = {
    vehicle: db.prepare(
      `INSERT INTO vehicles (brand, model, version, year_fab, year_model, plate, km, color, fuel, transmission, status, sale_price, notes, is_demo)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1)`
    ),
    purchase: db.prepare(
      `INSERT INTO purchases (vehicle_id, seller, date, price, payment_method, notes, is_demo) VALUES (?,?,?,?,?,?,1)`
    ),
    cost: db.prepare(
      `INSERT INTO costs (vehicle_id, category, description, amount, date, is_demo) VALUES (?,?,?,?,?,1)`
    ),
    customer: db.prepare(
      `INSERT INTO customers (name, cpf_cnpj, phone, email, city, notes, status, is_demo) VALUES (?,?,?,?,?,?,?,1)`
    ),
    deal: db.prepare(
      `INSERT INTO deals (vehicle_id, customer_id, stage, proposed_price, sale_price, down_payment, payment_method, financed_amount, commission, notes, sold_date, delivered_date, is_demo)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)`
    ),
    task: db.prepare(
      `INSERT INTO tasks (vehicle_id, type, description, assignee, due_date, status, cost, cost_id, done_date, is_demo)
       VALUES (?,?,?,?,?,?,?,?,?,1)`
    ),
    doc: db.prepare(
      `INSERT INTO documents (name, type, vehicle_id, customer_id, deal_id, file_name, mime, size, is_demo) VALUES (?,?,?,?,?,?,?,?,1)`
    ),
    payable: db.prepare(
      `INSERT INTO payables (description, category, amount, due_date, status, paid_date, vehicle_id, is_demo) VALUES (?,?,?,?,?,?,?,1)`
    ),
    receivable: db.prepare(
      `INSERT INTO receivables (description, customer_id, deal_id, amount, due_date, status, received_date, is_demo) VALUES (?,?,?,?,?,?,?,1)`
    ),
    event: db.prepare(
      `INSERT INTO events (vehicle_id, customer_id, deal_id, type, description, amount, date, is_demo) VALUES (?,?,?,?,?,?,?,1)`
    ),
  };

  const id = (r: { lastInsertRowid: number | bigint }) => Number(r.lastInsertRowid);

  const ev = (
    type: string,
    description: string,
    date: string,
    o: { vehicle?: number; customer?: number; deal?: number; amount?: number } = {}
  ) => q.event.run(o.vehicle ?? null, o.customer ?? null, o.deal ?? null, type, description, o.amount ?? null, date);

  const addCost = (vehicle: number, category: CostCategory, desc: string, amount: number, date: string) => {
    const costId = id(q.cost.run(vehicle, category, desc, amount, date));
    ev("custo", `Custo adicionado — ${COST_CATEGORY[category]}: ${desc}`, date, { vehicle, amount });
    return costId;
  };

  type TaskSpec = Partial<
    Record<TaskType, { done?: string; desc?: string; assignee?: string; due?: string; cost?: number; costId?: number }>
  >;
  const mkTasks = (vehicle: number, spec: TaskSpec) => {
    for (const t of DEFAULT_CHECKLIST) {
      const s = spec[t] ?? {};
      q.task.run(
        vehicle,
        t,
        s.desc ?? null,
        s.assignee ?? null,
        s.due ?? null,
        s.done ? "concluida" : "pendente",
        s.cost ?? null,
        s.costId ?? null,
        s.done ?? null
      );
    }
  };
  const allDone = (date: string): TaskSpec =>
    Object.fromEntries(DEFAULT_CHECKLIST.map((t) => [t, { done: date }])) as TaskSpec;

  const mkDoc = (
    name: string,
    type: string,
    links: { vehicle?: number; customer?: number; deal?: number },
    lines: string[],
    date: string
  ) => {
    const pdf = makeDemoPdf(name, lines);
    const fileName = `demo-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.pdf`;
    fs.writeFileSync(path.join(UPLOADS_DIR, fileName), pdf);
    q.doc.run(name, type, links.vehicle ?? null, links.customer ?? null, links.deal ?? null, fileName, "application/pdf", pdf.length);
    ev("documento", `Documento anexado — ${name}`, date, { vehicle: links.vehicle, customer: links.customer });
  };

  db.exec("BEGIN");
  try {
    // ------------------------------------------------------------- clientes
    const joao = id(q.customer.run("João Pereira", "412.683.590-07", "(11) 98321-4455", "joao.pereira@gmail.com", "São Paulo", null, "vendido"));
    const maria = id(q.customer.run("Maria Santos", "284.115.760-20", "(19) 99874-1122", "maria.santos82@hotmail.com", "Campinas", null, "vendido"));
    const rafael = id(q.customer.run("Rafael Almeida", "530.902.148-66", "(15) 98102-7788", "rafa.almeida@gmail.com", "Sorocaba", null, "vendido"));
    const carlos = id(q.customer.run("Carlos Lima", "198.447.302-53", "(11) 97744-9090", "carlos.lima@uol.com.br", "São Paulo", "Quer entregar o carro atual na troca em uma próxima compra.", "negociacao"));
    const ana = id(q.customer.run("Ana Oliveira", "376.520.891-04", "(11) 96655-2301", "ana.oliveira@gmail.com", "Santo André", null, "negociacao"));
    const pedro = id(q.customer.run("Pedro Souza", "645.218.930-71", "(11) 95511-8742", "pedrosouza.sp@gmail.com", "Osasco", "Procura hatch econômico até R$ 65 mil.", "interessado"));
    const lucas = id(q.customer.run("Lucas Martins", "809.134.625-38", "(11) 94433-6718", "lucas.martins@gmail.com", "Guarulhos", null, "perdido"));
    const fernanda = id(q.customer.run("Fernanda Costa", "271.956.403-19", "(11) 93322-5566", "fe.costa@gmail.com", "São Paulo", "Indicação do João Pereira. Procura SUV automático até R$ 120 mil.", "novo"));

    // ------------------------------------------------- 1. HR-V — vendido e entregue neste mês
    const hrv = id(q.vehicle.run("Honda", "HR-V", "EXL 1.5", 2022, 2022, "RTB4C21", 38400, "Prata", "Flex", "CVT", "vendido", R(107900), null));
    q.purchase.run(hrv, "Particular — Marcos Vieira", d(75), R(98000), "PIX", null);
    ev("compra", "Compra registrada — Particular (Marcos Vieira)", d(75), { vehicle: hrv, amount: R(98000) });
    addCost(hrv, "despachante", "Transferência + vistoria", R(450), d(70));
    addCost(hrv, "estetica", "Polimento e vitrificação", R(600), d(65));
    addCost(hrv, "lavagem", "Higienização interna completa", R(180), d(62));
    addCost(hrv, "anuncios", "Destaque no anúncio (30 dias)", R(180), d(58));
    ev("preco", "Preço de venda definido: R$ 107.900", d(57), { vehicle: hrv, amount: R(107900) });
    mkTasks(hrv, allDone(d(57)));

    const hrvSold = inMonth(d(8));
    const hrvDelivered = inMonth(d(5));
    const hrvDeal = id(
      q.deal.run(hrv, joao, "entregue", R(105500), R(106400), R(30000), "Entrada + financiamento", R(76400), R(500), null, hrvSold, hrvDelivered)
    );
    addCost(hrv, "comissao", "Comissão — vendedor parceiro", R(500), hrvSold);
    ev("proposta", "Proposta de João Pereira: R$ 105.500", d(12), { vehicle: hrv, customer: joao, deal: hrvDeal, amount: R(105500) });
    ev("reserva", "Veículo reservado para João Pereira", d(10), { vehicle: hrv, customer: joao, deal: hrvDeal });
    ev("venda", "Venda registrada para João Pereira — R$ 106.400", hrvSold, { vehicle: hrv, customer: joao, deal: hrvDeal, amount: R(106400) });
    q.receivable.run("Entrada — venda HR-V EXL", joao, hrvDeal, R(30000), hrvSold, "recebido", hrvSold);
    ev("recebimento", "Entrada recebida — venda HR-V", hrvSold, { vehicle: hrv, customer: joao, deal: hrvDeal, amount: R(30000) });
    const hrvRec2 = notFuture(addDaysISO(hrvSold, 2));
    q.receivable.run("Repasse financiamento — HR-V EXL", joao, hrvDeal, R(76400), hrvRec2, "recebido", hrvRec2);
    ev("recebimento", "Repasse do financiamento recebido — HR-V", hrvRec2, { vehicle: hrv, customer: joao, deal: hrvDeal, amount: R(76400) });
    ev("entrega", "Veículo entregue a João Pereira", hrvDelivered, { vehicle: hrv, customer: joao, deal: hrvDeal });

    // ------------------------------------------------- 2. Corolla — vendido neste mês, saldo a receber
    const corolla = id(q.vehicle.run("Toyota", "Corolla", "XEi 2.0", 2020, 2021, "QPM7E34", 52300, "Branco", "Flex", "Automático", "vendido", R(103900), null));
    q.purchase.run(corolla, "Repasse — AutoMax Seminovos", d(60), R(92000), "Transferência", null);
    ev("compra", "Compra registrada — AutoMax Seminovos (repasse)", d(60), { vehicle: corolla, amount: R(92000) });
    addCost(corolla, "despachante", "Transferência + vistoria", R(450), d(52));
    addCost(corolla, "manutencao", "Pastilhas, óleo e filtros", R(1850), d(50));
    addCost(corolla, "lavagem", "Higienização interna", R(180), d(45));
    ev("preco", "Preço de venda definido: R$ 103.900", d(48), { vehicle: corolla, amount: R(103900) });
    mkTasks(corolla, { ...allDone(d(45)), transferencia: { assignee: "Despachante Sílvia", due: inD(5) } });

    const corollaSold = inMonth(d(3));
    const corollaDeal = id(
      q.deal.run(corolla, maria, "vendido", R(101000), R(102500), R(82500), "Entrada + financiamento", R(20000), null, "Saldo é o repasse do banco.", corollaSold, null)
    );
    ev("proposta", "Proposta de Maria Santos: R$ 101.000", d(6), { vehicle: corolla, customer: maria, deal: corollaDeal, amount: R(101000) });
    ev("venda", "Venda registrada para Maria Santos — R$ 102.500", corollaSold, { vehicle: corolla, customer: maria, deal: corollaDeal, amount: R(102500) });
    q.receivable.run("Entrada — venda Corolla XEi", maria, corollaDeal, R(82500), corollaSold, "recebido", corollaSold);
    ev("recebimento", "Entrada recebida — venda Corolla", corollaSold, { vehicle: corolla, customer: maria, deal: corollaDeal, amount: R(82500) });
    q.receivable.run("Repasse financiamento — Corolla XEi", maria, corollaDeal, R(20000), addDaysISO(corollaSold, 7), "pendente", null);

    // ------------------------------------------------- 3. T-Cross — vendido e entregue há ~2 meses
    const tcross = id(q.vehicle.run("Volkswagen", "T-Cross", "Comfortline 200 TSI", 2022, 2023, "SDH2K88", 29100, "Cinza", "Flex", "Automático", "vendido", R(129900), null));
    q.purchase.run(tcross, "Particular — Regina Souza", d(130), R(118000), "Transferência", null);
    ev("compra", "Compra registrada — Particular (Regina Souza)", d(130), { vehicle: tcross, amount: R(118000) });
    addCost(tcross, "despachante", "Transferência + vistoria", R(450), d(125));
    addCost(tcross, "manutencao", "Revisão dos 30 mil", R(980), d(120));
    addCost(tcross, "estetica", "Polimento técnico", R(550), d(115));
    addCost(tcross, "anuncios", "Anúncio em portais", R(140), d(112));
    ev("preco", "Preço de venda definido: R$ 129.900", d(112), { vehicle: tcross, amount: R(129900) });
    mkTasks(tcross, allDone(d(110)));
    const tcrossDeal = id(q.deal.run(tcross, rafael, "entregue", null, R(129900), R(129900), "PIX", null, null, null, d(70), d(67)));
    ev("venda", "Venda registrada para Rafael Almeida — R$ 129.900", d(70), { vehicle: tcross, customer: rafael, deal: tcrossDeal, amount: R(129900) });
    q.receivable.run("Pagamento à vista — T-Cross", rafael, tcrossDeal, R(129900), d(70), "recebido", d(70));
    ev("recebimento", "Pagamento à vista recebido — T-Cross", d(70), { vehicle: tcross, customer: rafael, deal: tcrossDeal, amount: R(129900) });
    ev("entrega", "Veículo entregue a Rafael Almeida", d(67), { vehicle: tcross, customer: rafael, deal: tcrossDeal });

    // ------------------------------------------------- 4. Compass — reservado
    const compass = id(q.vehicle.run("Jeep", "Compass", "Longitude T270", 2021, 2022, "RKV9A02", 41700, "Preto", "Flex", "Automático", "reservado", R(139900), null));
    q.purchase.run(compass, "Particular — Eduardo Tanaka", d(28), R(125000), "PIX", null);
    ev("compra", "Compra registrada — Particular (Eduardo Tanaka)", d(28), { vehicle: compass, amount: R(125000) });
    addCost(compass, "despachante", "Transferência + vistoria", R(450), d(24));
    addCost(compass, "manutencao", "Correia, velas e alinhamento", R(2400), d(20));
    addCost(compass, "estetica", "Polimento + higienização de bancos", R(850), d(15));
    addCost(compass, "anuncios", "Anúncio em portais", R(220), d(14));
    ev("preco", "Preço de venda definido: R$ 139.900", d(16), { vehicle: compass, amount: R(139900) });
    mkTasks(compass, allDone(d(14)));
    const compassDeal = id(
      q.deal.run(compass, carlos, "reservado", R(136500), null, null, null, null, null, "Sinal de R$ 2.000 pago. Contrato na sexta-feira.", null, null)
    );
    ev("contato", "Test drive com Carlos Lima", d(10), { vehicle: compass, customer: carlos });
    ev("proposta", "Proposta de Carlos Lima: R$ 136.500", d(6), { vehicle: compass, customer: carlos, deal: compassDeal, amount: R(136500) });
    ev("reserva", "Veículo reservado para Carlos Lima", d(2), { vehicle: compass, customer: carlos, deal: compassDeal });

    // ------------------------------------------------- 5. HB20 — anunciado, com proposta
    const hb20 = id(q.vehicle.run("Hyundai", "HB20", "Vision 1.0", 2023, 2023, "SRF5J19", 18900, "Branco", "Flex", "Manual", "anunciado", R(79900), null));
    q.purchase.run(hb20, "Repasse — Garage 21", d(18), R(72500), "PIX", null);
    ev("compra", "Compra registrada — Garage 21 (repasse)", d(18), { vehicle: hb20, amount: R(72500) });
    addCost(hb20, "despachante", "Transferência + vistoria", R(450), d(15));
    addCost(hb20, "lavagem", "Lavagem completa", R(160), d(13));
    addCost(hb20, "anuncios", "Anúncios em portais + destaque", R(370), d(10));
    ev("preco", "Preço de venda definido: R$ 79.900", d(12), { vehicle: hb20, amount: R(79900) });
    mkTasks(hb20, allDone(d(10)));
    const hb20Deal = id(q.deal.run(hb20, ana, "proposta", R(77500), null, null, null, null, null, null, null, null));
    ev("contato", "Ana Oliveira visitou a loja e fez test drive", d(5), { vehicle: hb20, customer: ana });
    ev("proposta", "Proposta de Ana Oliveira: R$ 77.500", d(2), { vehicle: hb20, customer: ana, deal: hb20Deal, amount: R(77500) });

    // ------------------------------------------------- 6. Argo — disponível, parado há 72 dias
    const argo = id(q.vehicle.run("Fiat", "Argo", "Drive 1.3", 2022, 2022, "QXC3M77", 33500, "Vermelho", "Flex", "Manual", "disponivel", R(64900), null));
    q.purchase.run(argo, "Particular — Cláudia Nunes", d(72), R(58000), "PIX", null);
    ev("compra", "Compra registrada — Particular (Cláudia Nunes)", d(72), { vehicle: argo, amount: R(58000) });
    addCost(argo, "despachante", "Transferência + vistoria", R(450), d(68));
    addCost(argo, "pecas", "2 pneus novos", R(790), d(60));
    ev("preco", "Preço de venda definido: R$ 64.900", d(58), { vehicle: argo, amount: R(64900) });
    mkTasks(argo, { ...allDone(d(58)), anuncio: { desc: "Publicar nos portais — pendente desde a preparação" } });
    q.deal.run(argo, pedro, "interessado", null, null, null, null, null, null, "Gostou do carro, vai conversar em casa.", null, null);
    ev("contato", "Pedro Souza visitou a loja e fez test drive no Argo", d(8), { vehicle: argo, customer: pedro });

    // ------------------------------------------------- 7. Onix — anunciado, parado há 95 dias, proposta perdida
    const onix = id(q.vehicle.run("Chevrolet", "Onix", "LT 1.0 Turbo", 2021, 2021, "RLP8B45", 47800, "Prata", "Flex", "Manual", "anunciado", R(67900), null));
    q.purchase.run(onix, "Particular — Fábio Ramos", d(95), R(61500), "Transferência", null);
    ev("compra", "Compra registrada — Particular (Fábio Ramos)", d(95), { vehicle: onix, amount: R(61500) });
    addCost(onix, "despachante", "Transferência + vistoria", R(450), d(90));
    addCost(onix, "manutencao", "Troca de óleo + correia do alternador", R(680), d(85));
    addCost(onix, "lavagem", "Lavagem completa", R(160), d(80));
    addCost(onix, "anuncios", "Anúncio em portais", R(240), d(75));
    addCost(onix, "anuncios", "Renovação de destaque", R(200), d(30));
    ev("preco", "Preço de venda definido: R$ 69.900", d(78), { vehicle: onix, amount: R(69900) });
    ev("preco", "Preço reduzido: R$ 69.900 → R$ 67.900", d(15), { vehicle: onix, amount: R(67900) });
    mkTasks(onix, allDone(d(75)));
    const onixDeal = id(
      q.deal.run(onix, lucas, "perdido", R(64000), null, null, null, null, null, "Achou o ano caro — comprou um 2022 em outra loja.", null, null)
    );
    ev("proposta", "Proposta de Lucas Martins: R$ 64.000", d(25), { vehicle: onix, customer: lucas, deal: onixDeal, amount: R(64000) });
    ev("status", "Negociação perdida — Lucas Martins", d(20), { vehicle: onix, customer: lucas, deal: onixDeal });

    // ------------------------------------------------- 8. Toro — em preparação
    const toro = id(q.vehicle.run("Fiat", "Toro", "Freedom 1.3 Turbo", 2022, 2022, "SGA6D53", 44600, "Cinza", "Flex", "Automático", "preparacao", null, "Único dono, revisões em concessionária."));
    q.purchase.run(toro, "Particular — Henrique Sales", d(6), R(96000), "Transferência", null);
    ev("compra", "Compra registrada — Particular (Henrique Sales)", d(6), { vehicle: toro, amount: R(96000) });
    addCost(toro, "frete", "Guincho Sorocaba → loja", R(900), d(5));
    mkTasks(toro, {
      revisao: { assignee: "Oficina do Léo", due: inD(2) },
      manutencao: { desc: "Correia dentada + fluidos", assignee: "Oficina do Léo", due: inD(3) },
      documentacao: { assignee: "Despachante Sílvia", due: inD(4) },
      fotos: { due: inD(5) },
    });

    // ------------------------------------------------- 9. Kwid — em preparação
    const kwid = id(q.vehicle.run("Renault", "Kwid", "Zen 1.0", 2023, 2024, "TBC1H96", 12300, "Branco", "Flex", "Manual", "preparacao", null, null));
    q.purchase.run(kwid, "Particular — Juliana Prado", d(3), R(52000), "PIX", null);
    ev("compra", "Compra registrada — Particular (Juliana Prado)", d(3), { vehicle: kwid, amount: R(52000) });
    const kwidRevCost = addCost(kwid, "manutencao", "Revisão: óleo e filtros", R(380), d(1));
    mkTasks(kwid, {
      revisao: { done: d(1), cost: R(380), costId: kwidRevCost, assignee: "Oficina do Léo" },
      manutencao: { done: d(1), desc: "Nada a corrigir" },
      documentacao: { done: d(1), assignee: "Despachante Sílvia" },
    });
    ev("tarefa", "Tarefa concluída — Revisão", d(1), { vehicle: kwid, amount: R(380) });

    // ------------------------------------------------------------- financeiro
    q.payable.run("IPVA 2026 — Jeep Compass", "Impostos", R(1800), inD(5), "pendente", null, compass);
    q.payable.run("Aluguel da loja — outubro", "Aluguel", R(4500), inD(8), "pendente", null, null);
    q.payable.run("Lote despachante (3 transferências)", "Documentação", R(2200), d(3), "pendente", null, null);
    q.payable.run("Lavagens — fechamento setembro", "Estética", R(350), d(10), "pago", d(10), null);
    ev("pagamento", "Conta paga — Lavagens (fechamento setembro)", d(10), { amount: R(350) });

    // ------------------------------------------------------------- contatos avulsos
    ev("contato", "Ligação de Fernanda Costa: procura SUV automático até R$ 120 mil", d(1), { customer: fernanda });

    // ------------------------------------------------------------- documentos (PDFs de exemplo)
    mkDoc("CRLV — HR-V EXL", "crlv", { vehicle: hrv }, ["Veículo: Honda HR-V EXL 1.5 2022", "Placa: RTB4C21", "Renavam: 00987654321"], d(70));
    mkDoc("Contrato de venda — HR-V EXL", "contrato", { vehicle: hrv, customer: joao, deal: hrvDeal }, ["Comprador: João Pereira", "Valor: R$ 106.400,00", "Forma: entrada + financiamento"], hrvSold);
    mkDoc("ATPV-e — Corolla XEi", "atpve", { vehicle: corolla, customer: maria, deal: corollaDeal }, ["Veículo: Toyota Corolla XEi 2.0", "Placa: QPM7E34", "Comprador: Maria Santos"], corollaSold);
    mkDoc("Comprovante PIX — entrada Corolla", "comprovante", { vehicle: corolla, customer: maria, deal: corollaDeal }, ["Valor: R$ 82.500,00", "Pagador: Maria Santos"], corollaSold);
    mkDoc("CRLV — Fiat Toro", "crlv", { vehicle: toro }, ["Veículo: Fiat Toro Freedom 1.3 Turbo 2022", "Placa: SGA6D53"], d(5));
    mkDoc("Laudo cautelar — HB20", "laudo", { vehicle: hb20 }, ["Veículo: Hyundai HB20 Vision 1.0 2023", "Resultado: aprovado, sem apontamentos"], d(14));

    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
