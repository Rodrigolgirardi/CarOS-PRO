/**
 * Normaliza os logos em public/logos: apara bordas transparentes/brancas e
 * centraliza num canvas quadrado 240×240 com margem uniforme.
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
  const input = fs.readFileSync(filePath);
  try {
    const out = await sharp(input)
      .trim({ threshold: 12 }) // remove margens (transparentes ou quase brancas)
      .resize(INNER, INNER, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({ top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(filePath, out);
    console.log(`✓ ${file} (${(out.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.error(`✗ ${file}:`, err.message);
  }
}
console.log(`\n${files.length} logos normalizados em ${DIR}`);
