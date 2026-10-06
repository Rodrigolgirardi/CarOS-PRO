import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import { DB_PATH, UPLOADS_DIR } from "./paths";
import { seedDemo } from "./seed";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS vehicles (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  brand        TEXT NOT NULL,
  model        TEXT NOT NULL,
  version      TEXT,
  year_fab     INTEGER,
  year_model   INTEGER,
  plate        TEXT,
  km           INTEGER,
  color        TEXT,
  fuel         TEXT,
  transmission TEXT,
  renavam      TEXT,
  chassis      TEXT,
  laudo        TEXT,
  blindado     INTEGER,
  leilao       TEXT,
  fipe_price   INTEGER,
  consignado   INTEGER NOT NULL DEFAULT 0,
  consignor    TEXT,
  consignor_value INTEGER,
  status       TEXT NOT NULL DEFAULT 'para_arrumar',
  sale_price   INTEGER,
  photo        TEXT,
  notes        TEXT,
  is_demo      INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchases (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id     INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  seller         TEXT,
  date           TEXT NOT NULL,
  price          INTEGER NOT NULL,
  payment_method TEXT,
  notes          TEXT,
  is_demo        INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS costs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id  INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  description TEXT,
  amount      INTEGER NOT NULL,
  date        TEXT NOT NULL,
  is_demo     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  cpf_cnpj   TEXT,
  phone      TEXT,
  email      TEXT,
  city       TEXT,
  notes      TEXT,
  kind       TEXT NOT NULL DEFAULT 'comprador',
  status     TEXT NOT NULL DEFAULT 'novo',
  is_demo    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deals (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id         INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_id        INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stage              TEXT NOT NULL DEFAULT 'interessado',
  proposed_price     INTEGER,
  sale_price         INTEGER,
  down_payment       INTEGER,
  payment_method     TEXT,
  financed_amount    INTEGER,
  trade_in_desc      TEXT,
  trade_in_value     INTEGER,
  commission         INTEGER,
  commission_cost_id INTEGER,
  notes              TEXT,
  sold_date          TEXT,
  delivered_date     TEXT,
  is_demo            INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sellers (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  commission_pct   REAL,
  commission_fixed INTEGER,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id  INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  description TEXT,
  assignee    TEXT,
  due_date    TEXT,
  status      TEXT NOT NULL DEFAULT 'pendente',
  cost        INTEGER,
  cost_id     INTEGER,
  done_date   TEXT,
  is_demo     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'outro',
  vehicle_id  INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  deal_id     INTEGER REFERENCES deals(id) ON DELETE SET NULL,
  purchase_id INTEGER REFERENCES purchases(id) ON DELETE SET NULL,
  file_name   TEXT NOT NULL,
  mime        TEXT,
  size        INTEGER,
  is_demo     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payables (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  category    TEXT,
  amount      INTEGER NOT NULL,
  due_date    TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pendente',
  paid_date   TEXT,
  vehicle_id  INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  is_demo     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receivables (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  description   TEXT NOT NULL,
  customer_id   INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  deal_id       INTEGER REFERENCES deals(id) ON DELETE CASCADE,
  amount        INTEGER NOT NULL,
  due_date      TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pendente',
  received_date TEXT,
  is_demo       INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id  INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  deal_id     INTEGER REFERENCES deals(id) ON DELETE SET NULL,
  type        TEXT NOT NULL,
  description TEXT NOT NULL,
  amount      INTEGER,
  date        TEXT NOT NULL,
  is_demo     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_purchases_vehicle  ON purchases(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_costs_vehicle      ON costs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_deals_vehicle      ON deals(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_deals_customer     ON deals(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_vehicle      ON tasks(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_docs_vehicle       ON documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_receivables_deal   ON receivables(deal_id);
CREATE INDEX IF NOT EXISTS idx_events_vehicle     ON events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_events_customer    ON events(customer_id);
`;

declare global {
  // Singleton por processo (sobrevive ao hot reload do Next em dev).
  var __carosDb: DatabaseSync | undefined;
}

export function getDb(): DatabaseSync {
  if (globalThis.__carosDb) return globalThis.__carosDb;

  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);

  // Migrações leves: colunas adicionadas depois do primeiro schema.
  const vehicleCols = (db.prepare("PRAGMA table_info(vehicles)").all() as { name: string }[]).map((c) => c.name);
  const addVehicleCol = (name: string, ddl: string) => {
    if (!vehicleCols.includes(name)) db.exec(`ALTER TABLE vehicles ADD COLUMN ${name} ${ddl}`);
  };
  addVehicleCol("chassis", "TEXT");
  addVehicleCol("laudo", "TEXT");
  addVehicleCol("blindado", "INTEGER");
  addVehicleCol("leilao", "TEXT");
  addVehicleCol("fipe_price", "INTEGER");
  addVehicleCol("consignado", "INTEGER NOT NULL DEFAULT 0");
  addVehicleCol("consignor", "TEXT");
  addVehicleCol("consignor_value", "INTEGER");
  const dealCols = (db.prepare("PRAGMA table_info(deals)").all() as { name: string }[]).map((c) => c.name);
  if (!dealCols.includes("seller_id")) db.exec("ALTER TABLE deals ADD COLUMN seller_id INTEGER REFERENCES sellers(id)");
  if (!dealCols.includes("channel")) db.exec("ALTER TABLE deals ADD COLUMN channel TEXT");

  // cache local de consultas de placa: cada placa pesquisada fica salva com tudo
  // que a API retornou — repetir a busca não gera nova cobrança
  db.exec(`CREATE TABLE IF NOT EXISTS plate_lookups (
    plate      TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    brand      TEXT,
    model      TEXT,
    version    TEXT,
    year_fab   INTEGER,
    year_model INTEGER,
    color      TEXT,
    fuel       TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // tabela de comissões padrão por tipo de operação (valores editáveis na aba Comissões)
  db.exec(`CREATE TABLE IF NOT EXISTS commission_rules (
    key    TEXT PRIMARY KEY,
    label  TEXT NOT NULL,
    amount INTEGER,
    sort   INTEGER NOT NULL DEFAULT 0
  )`);
  const seedRule = db.prepare("INSERT OR IGNORE INTO commission_rules (key, label, amount, sort) VALUES (?,?,?,?)");
  seedRule.run("venda_carro", "Venda de carro", 35000, 1);
  seedRule.run("documentacao", "Documentação", 2000, 2);
  seedRule.run("financiamento", "Financiamento", 5000, 3);
  seedRule.run("venda_moto", "Venda de moto", 25000, 4);
  seedRule.run("venda_caminhao", "Venda de caminhão", 50000, 5);
  seedRule.run("outros", "Outros", null, 6);
  const sellerCols = (db.prepare("PRAGMA table_info(sellers)").all() as { name: string }[]).map((c) => c.name);
  if (!sellerCols.includes("commission_fixed")) db.exec("ALTER TABLE sellers ADD COLUMN commission_fixed INTEGER");
  const customerCols = (db.prepare("PRAGMA table_info(customers)").all() as { name: string }[]).map((c) => c.name);
  if (!customerCols.includes("kind")) db.exec("ALTER TABLE customers ADD COLUMN kind TEXT NOT NULL DEFAULT 'comprador'");

  // status antigos → novos (idempotente; roda em toda subida)
  db.exec(`
    UPDATE vehicles SET status = 'para_arrumar'  WHERE status = 'preparacao';
    UPDATE vehicles SET status = 'para_cadastrar' WHERE status = 'disponivel';
    UPDATE vehicles SET status = 'cadastrado'     WHERE status IN ('anunciado', 'reservado');
  `);

  // Dados de demonstração: apenas na primeira execução, nunca de novo após limpeza.
  const seeded = db.prepare("SELECT value FROM meta WHERE key = 'demo_seeded'").get();
  if (!seeded) {
    const { n } = db.prepare("SELECT COUNT(*) AS n FROM vehicles").get() as { n: number };
    if (n === 0) seedDemo(db);
    db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('demo_seeded', '1')").run();
  }

  globalThis.__carosDb = db;
  return db;
}

type Param = string | number | null;

// node:sqlite devolve objetos com protótipo nulo, que o React não serializa
// para client components — normalizamos para objetos simples.
const plain = <T,>(row: unknown): T => ({ ...(row as Record<string, unknown>) }) as T;

export function all<T>(sql: string, ...params: Param[]): T[] {
  return (getDb().prepare(sql).all(...params) as unknown[]).map((r) => plain<T>(r));
}

export function get<T>(sql: string, ...params: Param[]): T | undefined {
  const row = getDb().prepare(sql).get(...params);
  return row == null ? undefined : plain<T>(row);
}

export function run(sql: string, ...params: Param[]): { changes: number; lastId: number } {
  const r = getDb().prepare(sql).run(...params);
  return { changes: Number(r.changes), lastId: Number(r.lastInsertRowid) };
}

/** Transação síncrona simples. */
export function tx<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/** Configurações simples em chave/valor (tabela meta). */
export function getMeta(key: string): string | null {
  const row = get<{ value: string | null }>("SELECT value FROM meta WHERE key = ?", key);
  return row?.value ?? null;
}

export function setMeta(key: string, value: string | null): void {
  if (value == null) run("DELETE FROM meta WHERE key = ?", key);
  else run("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", key, value);
}

/** Existe algum dado de demonstração? (controla o aviso na interface) */
export function hasDemoData(): boolean {
  const tables = ["vehicles", "customers", "payables", "receivables"];
  for (const t of tables) {
    const row = get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${t} WHERE is_demo = 1`);
    if (row && row.n > 0) return true;
  }
  return false;
}
