import { defineConfig } from "drizzle-kit";

const url = process.env.SUPABASE_DB_URL;
if (!url && process.env.NODE_ENV !== "test") {
  console.warn("[drizzle.config] SUPABASE_DB_URL not set — generate-only mode");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url: url ?? "postgres://placeholder" },
  verbose: true,
  strict: true,
});
