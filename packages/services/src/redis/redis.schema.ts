import { TASKS_STATUS, WORKERS_STATUS } from "@sw/common/constants";
import { z } from "zod";

export const TaskSchema = z.object({
	id: z.string(),
	status: z.enum([
		TASKS_STATUS.PENDING,
		TASKS_STATUS.RUNNING,
		TASKS_STATUS.FINISHED,
	]),
	processedBy: z.string().nullable(),
	durationMs: z.number(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	startedAt: z.coerce.date().nullable(),
	finishedAt: z.coerce.date().nullable(),
});

export const WorkerSchema = z.object({
	id: z.string(),
	status: z.enum([
		WORKERS_STATUS.BOOT,
		WORKERS_STATUS.IDLE,
		WORKERS_STATUS.BUSY,
		WORKERS_STATUS.SHUTDOWN,
	]),
	createdAt: z.coerce.date(),
	deletedAt: z.coerce.date().nullable(),
	currentTaskId: z.string().nullable(),
	currentTask: TaskSchema.nullable(),
	processedTasks: z.array(TaskSchema),
});

export const StatsSchema = z.object({
	queueCount: z.number(),
	deadLetterQueueCount: z.number(),
	tasksProcessed: z.number(),
	tasksWaiting: z.number(),
	workersCount: z.number(),
	averageTimeByTask: z.number(),
});
