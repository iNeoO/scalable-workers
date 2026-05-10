import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./db/schema.table";

export * from "drizzle-orm";
export * from "./db/schema.table";

// biome-ignore lint/style/noNonNullAssertion: variable will be provided
export const db = drizzle(process.env.PG_URL!, { schema });
export type Database = typeof db;
