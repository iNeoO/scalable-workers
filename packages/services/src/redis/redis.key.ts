import { TASK_EVENTS, WORKER_EVENTS } from "@sw/common/constants";

export const taskEventStatuses = [
	TASK_EVENTS.CREATED,
	TASK_EVENTS.STARTED,
	TASK_EVENTS.FINISHED,
] as const;
export type TaskEventStatus = (typeof taskEventStatuses)[number];
export const workerEventStatuses = [
	WORKER_EVENTS.CREATED,
	WORKER_EVENTS.UPDATED,
	WORKER_EVENTS.REMOVED,
] as const;
export type WorkerEventStatus = (typeof workerEventStatuses)[number];

export const tasksProcessed = () => "tasksProcessed";
export const tasksWaiting = () => "tasksWaiting";
export const workersCount = () => "workersCount";
export const totalTimeByTask = () => "totalTimeByTask";
export const taskEvent = (status: TaskEventStatus) => `task.${status}` as const;
export const taskEventPattern = () => "task.*" as const;
export const workerEvent = (status: WorkerEventStatus) =>
	`worker.${status}` as const;
export const workerEventPattern = () => "worker.*" as const;
export const statsUpdated = () => "stats.updated" as const;
