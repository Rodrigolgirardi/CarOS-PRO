import { BRANDS, brandSlug } from "./brands";

/**
 * Consulta de placa via API Placas (wdapi2.com.br) — serviço pago de terceiros.
 * O parser é defensivo: provedores variam os campos, então tudo é opcional.
 * Para trocar de provedor na fase 2, basta reimplementar `fetchPlate`.
 */

export interface PlateData {
  brand: string | null;
  model: string | null;
  version: string | null;
  year_fab: number | null;
  year_model: number | null;
  color: string | null;
  fuel: string | null;
  city: string | null;
  chassis: string | null;
}

export type PlateLookupResult =
  | { ok: true; data: PlateData }
  | { ok: false; error: string; needsToken?: boolean };

/** ABC1234 (antiga) ou ABC1D23 (Mercosul). */
export function normalizePlate(input: string): string | null {
  const plate = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z]{3}\d([A-Z]\d{2}|\d{3})$/.test(plate) ? plate : null;
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

const titleCase = (s: string) =>
  s.toLowerCase().replace(/(^|[\s\-/])\p{L}/gu, (c) => c.toUpperCase());

function mapFuel(raw: string | null): string | null {
  if (!raw) return null;
  const f = raw.toLowerCase();
  const alcool = f.includes("alcool") || f.includes("álcool") || f.includes("etanol");
  const gasolina = f.includes("gasolina");
  if ((alcool && gasolina) || f.includes("flex")) return "Flex";
  if (f.includes("diesel")) return "Diesel";
  if (f.includes("eletr")) return "Elétrico";
  if (f.includes("hibrid") || f.includes("híbrid")) return "Híbrido";
  if (gasolina) return "Gasolina";
  return null;
}

/** Interpreta a resposta do provedor (campos variam entre maiúsculas/minúsculas). */
export function parsePlateResponse(json: Record<string, unknown>): PlateData {
  const pick = (...keys: string[]): string | null => {
    for (const k of keys) {
      const v = str(json[k]);
      if (v) return v;
    }
    return null;
  };
  const year = (...keys: string[]): number | null => {
    const v = pick(...keys);
    if (!v) return null;
    const n = Number(v.replace(/\D/g, "").slice(0, 4));
    return n >= 1950 && n <= 2100 ? n : null;
  };

  // marca: "VW - VolksWagen" → VolksWagen → nome canônico quando conhecida
  const brandRaw = pick("MARCA", "marca");
  let brand = brandRaw;
  if (brand?.includes(" - ")) brand = brand.split(" - ").pop()!.trim();
  const slug = brandSlug(brand);
  brand = (slug && BRANDS.find((b) => b.slug === slug)?.name) ?? (brand ? titleCase(brand) : null);

  // modelo: "GOL 1.0L MC4" ou "VW/GOL 1.0" (+ SUBMODELO "GOL" quando existe)
  let modelFull = pick("MODELO", "modelo");
  const sub = pick("SUBMODELO", "submodelo");
  if (modelFull) {
    modelFull = modelFull.replace(/^[A-Z]{1,12}\//, "").trim();
    for (const prefix of [brandRaw, brand]) {
      if (prefix && modelFull.toUpperCase().startsWith(prefix.toUpperCase() + " ")) {
        modelFull = modelFull.slice(prefix.length).trim();
      }
    }
  }
  let model: string | null = null;
  let version: string | null = null;
  if (sub && modelFull && modelFull.toUpperCase().startsWith(sub.toUpperCase())) {
    model = titleCase(sub);
    version = modelFull.slice(sub.length).trim() || null;
  } else if (modelFull) {
    const [first, ...rest] = modelFull.split(/\s+/);
    model = titleCase(first);
    version = rest.join(" ") || null;
  } else if (sub) {
    model = titleCase(sub);
  }
  version = version ?? pick("VERSAO", "versao");

  const color = pick("cor", "COR");
  const city = pick("municipio", "MUNICIPIO");

  // chassi: alguns provedores mascaram com "*" — só aceitamos um VIN completo
  const chassisRaw = pick("chassi", "CHASSI", "chassis")?.toUpperCase().replace(/\s+/g, "") ?? null;
  const chassis = chassisRaw && /^[A-HJ-NPR-Z0-9]{17}$/.test(chassisRaw) ? chassisRaw : null;
  return {
    brand,
    model,
    version,
    year_fab: year("ano", "ANO", "anoFabricacao"),
    year_model: year("anoModelo", "ano_modelo", "ANO_MODELO"),
    color: color ? titleCase(color) : null,
    fuel: mapFuel(pick("combustivel", "COMBUSTIVEL", "extra_combustivel")),
    city: city ? titleCase(city) : null,
    chassis,
  };
}

/** Chama o provedor. Lança apenas erros de rede; status HTTP é tratado no retorno. */
export async function fetchPlate(plate: string, token: string): Promise<PlateLookupResult> {
  let res: Response;
  try {
    res = await fetch(`https://wdapi2.com.br/consulta/${plate}/${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "Sem conexão com o serviço de consulta. Verifique sua internet." };
  }

  if (res.status === 401 || res.status === 402 || res.status === 403) {
    return { ok: false, needsToken: true, error: "Token inválido ou sem créditos no provedor." };
  }
  if (res.status === 404) {
    return { ok: false, error: "Placa não encontrada na base do provedor." };
  }
  if (!res.ok) {
    return { ok: false, error: `O serviço de consulta respondeu com erro (${res.status}). Tente de novo.` };
  }

  let json: Record<string, unknown>;
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "Resposta inesperada do serviço de consulta." };
  }

  const data = parsePlateResponse(json);
  if (!data.brand && !data.model) {
    const msg = str(json.message) ?? str(json.mensagem);
    return { ok: false, error: msg ?? "A consulta não retornou dados do veículo." };
  }
  return { ok: true, data };
}
