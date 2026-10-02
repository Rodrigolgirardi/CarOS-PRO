import path from "node:path";

/** Diretório de dados locais (banco + uploads). Fica fora do build, fácil de fazer backup. */
export const DATA_DIR = path.join(process.cwd(), "data");
export const DB_PATH = path.join(DATA_DIR, "caros.db");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
