import type { workersTable } from "@sw/drizzle";

export type CreateWorkerParams = Omit<
	typeof workersTable.$inferInsert,
	"id" | "createdAt" | "currentTaskId"
>;
export type UpdateWorkerParams = Required<
	Pick<typeof workersTable.$inferInsert, "id" | "status" | "currentTaskId">
> & { isNbTaskUpdate: boolean };
