import type { TaskEvent, WorkerEvent } from "@sw/common/types";
import type { Redis } from "@sw/infra/libs";
import { z } from "zod";
import {
	statsUpdated,
	taskEvent,
	tasksProcessed,
	tasksWaiting,
	totalTimeByTask,
	workerEvent,
	workersCount,
} from "./redis.key.js";
import type { Stats, Task, Worker } from "./redis.type.js";

const redisNumberSchema = z.coerce.number();

export class RedisService {
	private redis: Redis;

	constructor(redis: Redis) {
		this.redis = redis;
	}

	async incrementTasksProcessed() {
		return await this.redis.incr(tasksProcessed());
	}

	async incrementTasksWaiting() {
		return await this.redis.incr(tasksWaiting());
	}

	async decrementTaskWaiting() {
		return await this.redis.decr(tasksWaiting());
	}

	async incrementWorkerCount() {
		return await this.redis.incr(workersCount());
	}

	decrementWorkerCount() {
		return this.redis.decr(workersCount());
	}

	private async getNumber(key: string) {
		const value = await this.redis.get(key);
		if (value === null) {
			return 0;
		}
		return redisNumberSchema.parse(value);
	}

	async getTasksProcessed() {
		return await this.getNumber(tasksProcessed());
	}

	async getTasksWaiting() {
		return await this.getNumber(tasksWaiting());
	}

	async getWorkersCount() {
		return await this.getNumber(workersCount());
	}

	async getTotalTimeByTask() {
		return await this.getNumber(totalTimeByTask());
	}

	async getAverageTimeByTask() {
		const [totalTime, nbTasks] = await Promise.all([
			this.getTotalTimeByTask(),
			this.getTasksProcessed(),
		]);

		if (nbTasks === 0) {
			return 0;
		}

		return totalTime / nbTasks;
	}

	async incrementAverageTimeByTask(time: number) {
		const parsedTime = redisNumberSchema.parse(time);
		const result = await this.redis
			.multi()
			.incrbyfloat(totalTimeByTask(), parsedTime)
			.incr(tasksProcessed())
			.exec();

		if (!result) {
			throw new Error("failed to update redis task average");
		}

		const totalTimeResult = result[0];
		const tasksProcessedResult = result[1];

		if (!totalTimeResult || !tasksProcessedResult) {
			throw new Error("failed to update redis task average");
		}

		const [totalTimeError, totalTime] = totalTimeResult;
		const [tasksProcessedError, nbTasks] = tasksProcessedResult;

		if (totalTimeError) {
			throw totalTimeError;
		}

		if (tasksProcessedError) {
			throw tasksProcessedError;
		}

		return (
			redisNumberSchema.parse(totalTime) / redisNumberSchema.parse(nbTasks)
		);
	}

	async stats() {
		const [tasksProcessed, tasksWaiting, workersCount, averageTimeByTask] =
			await Promise.all([
				this.getTasksProcessed(),
				this.getTasksWaiting(),
				this.getWorkersCount(),
				this.getAverageTimeByTask(),
			]);

		return {
			tasksProcessed,
			tasksWaiting,
			workersCount,
			averageTimeByTask,
		};
	}

	async publishTask(task: Task, status: TaskEvent) {
		const key = taskEvent(status);
		return await this.redis.publish(key, JSON.stringify(task));
	}

	async publishWorker(worker: Worker, status: WorkerEvent) {
		const key = workerEvent(status);
		return await this.redis.publish(key, JSON.stringify(worker));
	}

	async publishStats(stats: Stats) {
		const key = statsUpdated();
		return await this.redis.publish(key, JSON.stringify(stats));
	}
}
