import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { tasksTable, workersTable } from "./db/schema.table";

export { tasksTable, workersTable };

// biome-ignore lint/style/noNonNullAssertion: variable will be provided
export const db = drizzle(process.env.PG_URL!);
export type Database = typeof db;
