import { readFile } from "node:fs/promises";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL not set");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false });
const db = drizzle(sql);

const migrationsFolder = path.resolve(import.meta.dir, "../migrations");
const rlsPath = path.resolve(import.meta.dir, "../sql/rls.sql");

console.log("→ running drizzle migrations…");
await migrate(db, { migrationsFolder });

console.log("→ applying RLS policies…");
const rlsSql = await readFile(rlsPath, "utf8");
await sql.unsafe(rlsSql);

await sql.end();
console.log("✓ migrate complete");
