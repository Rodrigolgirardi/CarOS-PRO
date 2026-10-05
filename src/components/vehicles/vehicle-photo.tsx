import { Car } from "lucide-react";
import { brandLogoUrl, brandSlug } from "@/lib/brands";
import { cn } from "@/lib/cn";

// Blocos quadrados; a foto aparece inteira dentro (object-contain), sem corte.
const SIZES = {
  xs: { box: "size-9 rounded-md", icon: 14 },
  sm: { box: "size-10 rounded-md", icon: 16 },
  md: { box: "size-12 rounded-lg", icon: 18 },
  xl: { box: "size-24 rounded-xl", icon: 26 },
  lg: { box: "aspect-square w-full rounded-xl", icon: 32 },
} as const;

interface VehiclePhotoProps {
  photo: string | null;
  /** nome da marca (ou rótulo completo) — sem foto, mostra o logo da montadora */
  brand?: string | null;
  alt?: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export function VehiclePhoto({ photo, brand, alt = "", size = "sm", className }: VehiclePhotoProps) {
  const s = SIZES[size];
  const slug = !photo ? brandSlug(brand) : null;
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden border border-zinc-200/70 text-zinc-400",
        slug ? "bg-white" : "bg-zinc-100",
        s.box,
        className
      )}
    >
      {photo ? (
        // object-contain: a foto aparece inteira, sem corte (sobra vira moldura cinza)
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/uploads/${encodeURIComponent(photo)}`} alt={alt} className="h-full w-full object-contain" />
      ) : slug ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brandLogoUrl(slug)} alt={alt} className="h-full w-full object-contain p-[12%]" />
      ) : (
        <Car size={s.icon} strokeWidth={1.5} />
      )}
    </div>
  );
}
