export const TASKS_STATUS = {
	PENDING: "pending",
	RUNNING: "running",
	FINISHED: "finished",
} as const;

export const WORKERS_STATUS = {
	BOOT: "boot",
	IDLE: "idle",
	BUSY: "busy",
	SHUTDOWN: "shutdown",
} as const;

export const TASK_EVENTS = {
	CREATED: "created",
	STARTED: "started",
	FINISHED: "finished",
} as const;

export const WORKER_EVENTS = {
	CREATED: "created",
	UPDATED: "updated",
	REMOVED: "removed",
} as const;
