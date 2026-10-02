/**
 * Marcas conhecidas com logo local em /public/logos/<slug>.png.
 * Logos: dataset público filippofilip95/car-logos-dataset (uso para identificação).
 */

export interface Brand {
  slug: string;
  name: string;
}

export const BRANDS: Brand[] = [
  { slug: "volkswagen", name: "Volkswagen" },
  { slug: "chevrolet", name: "Chevrolet" },
  { slug: "fiat", name: "Fiat" },
  { slug: "toyota", name: "Toyota" },
  { slug: "honda", name: "Honda" },
  { slug: "hyundai", name: "Hyundai" },
  { slug: "jeep", name: "Jeep" },
  { slug: "renault", name: "Renault" },
  { slug: "nissan", name: "Nissan" },
  { slug: "ford", name: "Ford" },
  { slug: "peugeot", name: "Peugeot" },
  { slug: "citroen", name: "Citroën" },
  { slug: "mitsubishi", name: "Mitsubishi" },
  { slug: "kia", name: "Kia" },
  { slug: "bmw", name: "BMW" },
  { slug: "mercedes-benz", name: "Mercedes-Benz" },
  { slug: "audi", name: "Audi" },
  { slug: "volvo", name: "Volvo" },
  { slug: "land-rover", name: "Land Rover" },
  { slug: "suzuki", name: "Suzuki" },
  { slug: "subaru", name: "Subaru" },
  { slug: "ram", name: "RAM" },
  { slug: "chery", name: "Chery" },
  { slug: "byd", name: "BYD" },
  { slug: "haval", name: "Haval" },
  { slug: "jac", name: "JAC" },
  { slug: "lexus", name: "Lexus" },
  { slug: "porsche", name: "Porsche" },
  { slug: "mini", name: "MINI" },
];

/** minúsculas, sem acentos, só letras/números separados por espaço */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const ALIASES: Record<string, string> = {
  vw: "volkswagen",
  volks: "volkswagen",
  gm: "chevrolet",
  chevy: "chevrolet",
  mercedes: "mercedes-benz",
  "mercedes bens": "mercedes-benz",
  "range rover": "land-rover",
  "caoa chery": "chery",
  "chery caoa": "chery",
  gwm: "haval",
  "great wall": "haval",
  "mini cooper": "mini",
};

const LOOKUP = new Map<string, string>();
for (const b of BRANDS) {
  LOOKUP.set(norm(b.name), b.slug);
  LOOKUP.set(norm(b.slug), b.slug);
}
for (const [alias, slug] of Object.entries(ALIASES)) LOOKUP.set(alias, slug);

/**
 * Resolve o slug do logo a partir do nome da marca OU de um rótulo completo
 * ("Honda HR-V EXL 1.5" → honda; "Land Rover Discovery" → land-rover).
 */
export function brandSlug(input: string | null | undefined): string | null {
  if (!input) return null;
  const n = norm(input);
  if (!n) return null;
  const words = n.split(" ");
  for (const candidate of [n, words.slice(0, 2).join(" "), words[0]]) {
    const hit = LOOKUP.get(candidate);
    if (hit) return hit;
  }
  return null;
}

export function brandLogoUrl(slug: string): string {
  return `/logos/${slug}.png`;
}
