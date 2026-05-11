import { getLoggerStore } from "@sw/infra/libs";
import type Redis from "ioredis";
import { ZodError } from "zod";
import {
	statsUpdated,
	taskEvent,
	taskEventPattern,
	taskEventStatuses,
	workerEvent,
	workerEventPattern,
	workerEventStatuses,
} from "./redis.key.js";
import { StatsSchema, TaskSchema, WorkerSchema } from "./redis.schema.js";
import type {
	Stats,
	StatsEvent,
	Task,
	TaskEvent,
	Worker,
	WorkerEvent,
} from "./redis.type.js";

const taskEvents = taskEventStatuses.map(taskEvent) as readonly TaskEvent[];
const workerEvents = workerEventStatuses.map(
	workerEvent,
) as readonly WorkerEvent[];

const isTaskEvent = (channel: string): channel is TaskEvent =>
	(taskEvents as readonly string[]).includes(channel);

const isWorkerEvent = (channel: string): channel is WorkerEvent =>
	(workerEvents as readonly string[]).includes(channel);

export class RedisSubscriber {
	private readonly redis: Redis;
	private taskCallback?: (type: TaskEvent, task: Task) => void;
	private workerCallback?: (type: WorkerEvent, worker: Worker) => void;
	private statsCallback?: (type: StatsEvent, stats: Stats) => void;
	private taskTimeout?: ReturnType<typeof setTimeout>;
	private workerTimeout?: ReturnType<typeof setTimeout>;
	private statsTimeout?: ReturnType<typeof setTimeout>;

	constructor(redis: Redis) {
		this.redis = redis;
		this.redis.on("pmessage", this.handlePatternMessage);
		this.redis.on("message", this.handleMessage);
	}

	private handlePatternMessage = (
		pattern: string,
		channel: string,
		message: string,
	) => {
		if (pattern === taskEventPattern()) {
			this.handleTaskMessage(channel, message);
			return;
		}

		if (pattern === workerEventPattern()) {
			this.handleWorkerMessage(channel, message);
		}
	};

	private handleMessage = (channel: string, message: string) => {
		if (channel === statsUpdated()) {
			this.handleStatsMessage(message);
		}
	};

	private handleTaskMessage(channel: string, message: string) {
		if (!this.taskCallback) {
			return;
		}

		if (!isTaskEvent(channel)) {
			this.warnWrongChannel(channel, taskEventPattern());
			return;
		}

		try {
			const json = JSON.parse(message);
			const task = TaskSchema.parse(json);

			if (this.taskTimeout) {
				clearTimeout(this.taskTimeout);
			}

			this.taskTimeout = setTimeout(() => {
				this.taskCallback?.(channel, task);
			}, 400);
		} catch (err) {
			this.logParseError(err, message, channel, "task");
		}
	}

	private handleWorkerMessage(channel: string, message: string) {
		if (!this.workerCallback) {
			return;
		}

		if (!isWorkerEvent(channel)) {
			this.warnWrongChannel(channel, workerEventPattern());
			return;
		}

		try {
			const json = JSON.parse(message);
			const worker = WorkerSchema.parse(json);

			if (this.workerTimeout) {
				clearTimeout(this.workerTimeout);
			}

			this.workerTimeout = setTimeout(() => {
				this.workerCallback?.(channel, worker);
			}, 400);
		} catch (err) {
			this.logParseError(err, message, channel, "worker");
		}
	}

	private handleStatsMessage(message: string) {
		if (!this.statsCallback) {
			return;
		}

		const channel = statsUpdated();

		try {
			const json = JSON.parse(message);
			const stats = StatsSchema.parse(json);

			if (this.statsTimeout) {
				clearTimeout(this.statsTimeout);
			}

			this.statsTimeout = setTimeout(() => {
				this.statsCallback?.(channel, stats);
			}, 400);
		} catch (err) {
			this.logParseError(err, message, channel, "stats");
		}
	}

	private warnWrongChannel(channel: string, pattern: string) {
		const logger = getLoggerStore();
		logger.warn({ channel, pattern }, "wrong channel used for redis message");
	}

	private logParseError(
		err: unknown,
		redisMessage: string,
		channel: string,
		type: "task" | "worker" | "stats",
	) {
		const logger = getLoggerStore();
		const parser = err instanceof ZodError ? "zod" : "JSON.parse";
		logger.error(
			{ err, redisMessage, channel },
			`error during parsing message for ${type} with ${parser}`,
		);
	}

	async subscribeTask(cb: (type: TaskEvent, task: Task) => void) {
		this.taskCallback = cb;
		const pattern = taskEventPattern();
		await this.redis.psubscribe(pattern);

		return async () => {
			await this.unsubscribeTask();
		};
	}

	async unsubscribeTask() {
		this.taskCallback = undefined;

		if (this.taskTimeout) {
			clearTimeout(this.taskTimeout);
			this.taskTimeout = undefined;
		}

		await this.redis.punsubscribe(taskEventPattern());
	}

	async subscribeWorker(cb: (type: WorkerEvent, worker: Worker) => void) {
		this.workerCallback = cb;
		const pattern = workerEventPattern();
		await this.redis.psubscribe(pattern);

		return async () => {
			await this.unsubscribeWorker();
		};
	}

	async unsubscribeWorker() {
		this.workerCallback = undefined;

		if (this.workerTimeout) {
			clearTimeout(this.workerTimeout);
			this.workerTimeout = undefined;
		}

		await this.redis.punsubscribe(workerEventPattern());
	}

	async subscribeStats(cb: (type: StatsEvent, stats: Stats) => void) {
		this.statsCallback = cb;
		const channel = statsUpdated();
		await this.redis.subscribe(channel);

		return async () => {
			await this.unsubscribeStats();
		};
	}

	async unsubscribeStats() {
		this.statsCallback = undefined;

		if (this.statsTimeout) {
			clearTimeout(this.statsTimeout);
			this.statsTimeout = undefined;
		}

		await this.redis.unsubscribe(statsUpdated());
	}

	async destroy() {
		await Promise.all([
			this.unsubscribeTask(),
			this.unsubscribeWorker(),
			this.unsubscribeStats(),
		]);

		this.redis.off("pmessage", this.handlePatternMessage);
		this.redis.off("message", this.handleMessage);
	}
}
