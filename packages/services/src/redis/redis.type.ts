import type { z } from "zod";
import type { statsUpdated, taskEvent, workerEvent } from "./redis.key.js";
import type { StatsSchema, TaskSchema, WorkerSchema } from "./redis.schema.js";

export type Task = z.infer<typeof TaskSchema>;
export type Worker = z.infer<typeof WorkerSchema>;
export type Stats = z.infer<typeof StatsSchema>;
export type TaskChannel = ReturnType<typeof taskEvent>;
export type WorkerChannel = ReturnType<typeof workerEvent>;
export type StatsChannel = ReturnType<typeof statsUpdated>;
export type PublishStatsParams = {
	queueCount: number;
	deadLetterQueueCount: number;
	tasksProcessed: number;
	tasksWaiting: number;
	workersCount: number;
	averageTimeByTask: number;
};
