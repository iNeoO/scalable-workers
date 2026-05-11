import type { z } from "zod";
import type { statsUpdated, taskEvent, workerEvent } from "./redis.key.js";
import type { StatsSchema, TaskSchema, WorkerSchema } from "./redis.schema.js";

export type Task = z.infer<typeof TaskSchema>;
export type Worker = z.infer<typeof WorkerSchema>;
export type Stats = z.infer<typeof StatsSchema>;
export type TaskEvent = ReturnType<typeof taskEvent>;
export type WorkerEvent = ReturnType<typeof workerEvent>;
export type StatsEvent = ReturnType<typeof statsUpdated>;
