import type { workersTable } from "@sw/drizzle";

export type CreateWorkerParams = Omit<typeof workersTable.$inferInsert, "id">;
