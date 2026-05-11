import { type Database, eq, tasksTable } from "@sw/drizzle";
import type { TaskProvider } from "@sw/task-worker/provider";
import { getLoggerStore } from "../../../infra/src/libs/asyncLocalStorage";
import type { CreateTaskParams, ProcessTaskParams } from "./tasks.type.js";

export class TasksService {
	private readonly drizzle: Database;
	private readonly taskProvider: TaskProvider;

	constructor(drizzle: Database, taskProvider: TaskProvider) {
		this.drizzle = drizzle;
		this.taskProvider = taskProvider;
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
			.values(task)
			.returning();

		if (!createdTask) {
			logger.error({ task }, "failed to create task");
			throw new Error("failed to create task");
		}

		this.taskProvider.send(createdTask.id);

		return createdTask;
	}

	async processTask({ id, status, processedBy }: ProcessTaskParams) {
		const logger = getLoggerStore();
		const updatedAt = new Date();
		logger.info({ id, status, processedBy }, "task processed");
		const [processedTask] = await this.drizzle
			.update(tasksTable)
			.set({
				status,
				updatedAt,
				processedBy,
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
