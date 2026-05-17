import type { tasksTable } from "@sw/drizzle";

export type CreateTaskParams = Omit<
	typeof tasksTable.$inferInsert,
	"id" | "createdAt" | "updatedAt" | "processedBy" | "status" | "finishedAt"
>;

export type ProcessTaskParams = Required<
	Omit<
		typeof tasksTable.$inferInsert,
		"createdAt" | "updatedAt" | "durationMs" | "startedAt" | "finishedAt"
	>
>;
