import type { tasksTable } from "@sw/drizzle";

export type CreateTaskParams = Omit<
	typeof tasksTable.$inferInsert,
	"id" | "createdAt" | "updatedAt" | "processedBy"
>;
