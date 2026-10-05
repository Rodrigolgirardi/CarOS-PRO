/**
 * Normaliza os logos em public/logos: encontra o símbolo pela varredura do
 * canal alfa (ignorando sombras suaves), centraliza num canvas 240×240.
 * Rode após adicionar novos logos:  node scripts/normalize-logos.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const DIR = path.join(process.cwd(), "public", "logos");
const CANVAS = 240;
const MARGIN = 10;
const INNER = CANVAS - MARGIN * 2;

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".png"));
for (const file of files) {
  const filePath = path.join(DIR, file);
  try {
    const img = sharp(filePath).ensureAlpha();
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H } = info;

    // bbox do conteúdo sólido: alfa alto E cor não-branca (sombras e fundos ficam de fora)
    let minX = W, maxX = -1, minY = H, maxY = -1;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const solid = data[i + 3] > 140;
        const nonWhite = data[i] < 235 || data[i + 1] < 235 || data[i + 2] < 235;
        if (solid && nonWhite) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) throw new Error("conteúdo não encontrado");

    const out = await sharp(filePath)
      .ensureAlpha()
      .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
      .resize(INNER, INNER, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({ top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(filePath, out);
    console.log(`✓ ${file}`);
  } catch (err) {
    console.error(`✗ ${file}:`, err.message);
  }
}
console.log(`\n${files.length} logos normalizados em ${DIR}`);
