/**
 * Formatação pt-BR.
 * Dinheiro é SEMPRE inteiro em centavos; datas são strings ISO (YYYY-MM-DD).
 */

/** R$ 70.000 ou R$ 70.000,50 (decimais só quando existem). */
export function brl(cents: number | null | undefined, opts?: { always?: boolean }): string {
  if (cents == null) return "—";
  const showCents = opts?.always || Math.round(Math.abs(cents)) % 100 !== 0;
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });
}

/** Aceita "70.000,50", "70000,50", "70.000", "70000.50", "R$ 1.234" → centavos. */
export function parseBRL(input: string | null | undefined): number | null {
  if (!input) return null;
  const clean = input.replace(/[^\d.,-]/g, "").trim();
  if (!clean) return null;
  let normalized: string;
  if (clean.includes(",")) {
    // formato brasileiro: pontos são milhar, vírgula é decimal
    normalized = clean.replace(/\./g, "").replace(",", ".");
  } else {
    const dots = (clean.match(/\./g) || []).length;
    // um único ponto seguido de 1–2 dígitos → decimal; senão, milhar
    normalized = dots === 1 && /\.\d{1,2}$/.test(clean) ? clean : clean.replace(/\./g, "");
  }
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

/** Centavos → valor para inputs ("70.000" / "70.000,50"). */
export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  const hasCents = Math.abs(cents) % 100 !== 0;
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
}

/** Fração → "7,69%". */
export function pct(frac: number | null | undefined, digits = 2): string {
  if (frac == null || !Number.isFinite(frac)) return "—";
  return (
    (frac * 100).toLocaleString("pt-BR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }) + "%"
  );
}

export function fmtKm(km: number | null | undefined): string {
  if (km == null) return "—";
  return km.toLocaleString("pt-BR") + " km";
}

export function fmtInt(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR");
}

// ---------------------------------------------------------------- datas

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Data local de hoje em ISO (YYYY-MM-DD). */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function daysAgoISO(days: number): string {
  return addDaysISO(todayISO(), -days);
}

/** Primeiro dia do mês atual. */
export function monthStartISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

/** "02/10/2026" */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y}`;
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2 out" (acrescenta o ano quando não é o atual). */
export function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  const year = new Date().getFullYear();
  return `${d} ${MONTHS[m - 1]}${y !== year ? ` ${y}` : ""}`;
}

/** Dias inteiros entre duas datas ISO (nunca negativo). */
export function daysBetween(a: string, b: string): number {
  const da = new Date(a.slice(0, 10) + "T00:00:00").getTime();
  const db = new Date(b.slice(0, 10) + "T00:00:00").getTime();
  return Math.max(0, Math.round((db - da) / 86_400_000));
}

export function daysSince(iso: string): number {
  return daysBetween(iso, todayISO());
}

/** Dias até a data (negativo = atrasado). */
export function daysUntil(iso: string): number {
  const now = new Date(todayISO() + "T00:00:00").getTime();
  const d = new Date(iso.slice(0, 10) + "T00:00:00").getTime();
  return Math.round((d - now) / 86_400_000);
}

export function fmtBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
