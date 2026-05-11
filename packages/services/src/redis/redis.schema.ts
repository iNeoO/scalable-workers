import { z } from "zod";

export const TaskSchema = z.object({
	id: z.string(),
	status: z.enum(["pending", "running", "finished"]),
	processedBy: z.string().nullable(),
	duration: z.number(),
	createdAt: z.coerce.date(),
	startedAt: z.coerce.date(),
	finishedAt: z.coerce.date(),
});

export const WorkerSchema = z.object({
	id: z.string(),
	status: z.enum(["boot", "idle", "busy", "shutdown"]),
	createdAt: z.coerce.date(),
	tasksDone: z.number(),
	currentTaskId: z.string().nullable(),
});

export const StatsSchema = z.object({
	tasksProcessed: z.number(),
	tasksWaiting: z.number(),
	workersCount: z.number(),
	averageTimeByTask: z.number(),
});
