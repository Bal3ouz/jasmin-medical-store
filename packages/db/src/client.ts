import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof createClient>;

export function createClient(databaseUrl: string) {
  const sql = postgres(databaseUrl, { max: 10, prepare: false });
  return drizzle(sql, { schema });
}
