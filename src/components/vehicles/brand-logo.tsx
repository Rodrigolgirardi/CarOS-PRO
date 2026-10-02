import { brandLogoUrl, brandSlug } from "@/lib/brands";
import { cn } from "@/lib/cn";

interface BrandLogoProps {
  /** nome da marca ou rótulo completo do veículo */
  brand: string | null | undefined;
  size?: number;
  className?: string;
}

/** Logo da montadora (nada é renderizado se a marca não for reconhecida). */
export function BrandLogo({ brand, size = 16, className }: BrandLogoProps) {
  const slug = brandSlug(brand);
  if (!slug) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brandLogoUrl(slug)}
      alt=""
      aria-hidden
      width={size}
      height={size}
      loading="lazy"
      className={cn("inline-block shrink-0 object-contain", className)}
    />
  );
}
