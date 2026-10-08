// Gera os ícones de "instalar na tela inicial" a partir da marca.
// Uso: node scripts/make-app-icons.mjs  (rodar de novo se a logo mudar)
import sharp from "sharp";

const SRC = "public/brand/caros-mark.png";

const OUT = [
  { file: "public/brand/icon-192.png", size: 192 },
  { file: "public/brand/icon-512.png", size: 512 },
  { file: "src/app/apple-icon.png", size: 180 }, // iPhone: Next linka sozinho
];

for (const { file, size } of OUT) {
  await sharp(SRC).resize(size, size, { fit: "cover" }).png().toFile(file);
  console.log(`${file} (${size}x${size})`);
}
