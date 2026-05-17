import type {
	TASK_EVENTS,
	TASKS_STATUS,
	WORKER_EVENTS,
	WORKERS_STATUS,
} from "../constants/status.constant.js";

export type TaskStatus = (typeof TASKS_STATUS)[keyof typeof TASKS_STATUS];
export type WorkerStatus = (typeof WORKERS_STATUS)[keyof typeof WORKERS_STATUS];
export type TaskEvent = (typeof TASK_EVENTS)[keyof typeof TASK_EVENTS];
export type WorkerEvent = (typeof WORKER_EVENTS)[keyof typeof WORKER_EVENTS];
