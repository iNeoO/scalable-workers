export const taskEventStatuses = ["created", "started", "finished"] as const;
export type TaskEventStatus = (typeof taskEventStatuses)[number];
export const workerEventStatuses = ["created", "updated", "removed"] as const;
export type WorkerEventStatus = (typeof workerEventStatuses)[number];

export const tasksProcessed = () => "tasksProcessed";
export const tasksWaiting = () => "tasksWaiting";
export const workersCount = () => "workersCount";
export const totalTimeByTask = () => "totalTimeByTask";
export const taskEvent = (status: TaskEventStatus) =>
	`task.${status}` as const;
export const taskEventPattern = () => "task.*" as const;
export const workerEvent = (status: WorkerEventStatus) =>
	`worker.${status}` as const;
export const workerEventPattern = () => "worker.*" as const;
export const statsUpdated = () => "stats.updated" as const;
