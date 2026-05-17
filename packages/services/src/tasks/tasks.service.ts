import { TASKS_STATUS } from "@sw/common/constants";
import { type Database, eq, tasksTable } from "@sw/drizzle";
import { getLoggerStore } from "@sw/infra/libs";
import type { RedisService } from "../redis/redis.service.js";
import type { StatsService } from "../stats/stats.service";
import type { CreateTaskParams, ProcessTaskParams } from "./tasks.type.js";

type TaskProvider = {
	send(id: string): void;
};

export class TasksService {
	private readonly drizzle: Database;
	private readonly taskProvider: TaskProvider;
	private readonly redisService: RedisService;
	private readonly statsService: StatsService;

	constructor(
		drizzle: Database,
		taskProvider: TaskProvider,
		redisService: RedisService,
		statsService: StatsService,
	) {
		this.drizzle = drizzle;
		this.taskProvider = taskProvider;
		this.redisService = redisService;
		this.statsService = statsService;
	}

	async getTasks() {
		return await this.drizzle.query.tasksTable.findMany({
			with: {
				processedByWorker: true,
			},
		});
	}

	async createTask(task: CreateTaskParams) {
		const logger = getLoggerStore();
		logger.info({ task }, "New task");
		const [createdTask] = await this.drizzle
			.insert(tasksTable)
			.values({ ...task, status: TASKS_STATUS.PENDING })
			.returning();

		if (!createdTask) {
			logger.error({ task }, "failed to create task");
			throw new Error("failed to create task");
		}

		this.taskProvider.send(createdTask.id);
		await this.redisService.incrementTasksWaiting();
		await Promise.all([
			this.statsService.publishStats(),
			this.redisService.publishTask(createdTask, "created"),
		]);
		return createdTask;
	}

	async processTask({ id, status, processedBy }: ProcessTaskParams) {
		const logger = getLoggerStore();
		logger.info({ id, status, processedBy }, "task processed");
		const now = new Date();
		const [processedTask] = await this.drizzle
			.update(tasksTable)
			.set({
				status,
				updatedAt: now,
				processedBy,
				startedAt: status === TASKS_STATUS.RUNNING ? now : undefined,
				finishedAt: status === TASKS_STATUS.FINISHED ? now : undefined,
			})
			.where(eq(tasksTable.id, id))
			.returning();

		if (!processedTask) {
			logger.error({ id, status, processedBy }, "failed to process task");
			throw new Error("failed to process task");
		}

		return processedTask;
	}

	async getTask(id: string) {
		return await this.drizzle.query.tasksTable.findFirst({
			where: eq(tasksTable.id, id),
			with: {
				processedByWorker: true,
			},
		});
	}

	async deleteTask(id: string) {
		const logger = getLoggerStore();
		logger.info({ id }, "delete task");
		const [deletedTask] = await this.drizzle
			.delete(tasksTable)
			.where(eq(tasksTable.id, id))
			.returning();

		if (!deletedTask) {
			logger.error({ id }, "failed to delete task");
			throw new Error("failed to delete task");
		}

		return deletedTask;
	}
}
