import { type Database, eq, sql, workersTable } from "@sw/drizzle";
import { getLoggerStore } from "../../../infra/src/libs/asyncLocalStorage.js";
import type { CreateWorkerParams, UpdateWorkerParams } from "./workers.type.js";

export class WorkersService {
	private readonly drizzle: Database;

	constructor(drizzle: Database) {
		this.drizzle = drizzle;
	}

	async getWorkers() {
		return await this.drizzle.query.workersTable.findMany({
			with: {
				currentTask: true,
				processedTasks: true,
			},
		});
	}

	async createWorker(worker: CreateWorkerParams) {
		const [createdWorker] = await this.drizzle
			.insert(workersTable)
			.values(worker)
			.returning();

		if (!createdWorker) {
			const logger = getLoggerStore();
			logger.error({ worker }, "failed to create worker");
			throw new Error("failed to create worker");
		}

		return createdWorker;
	}

	async updateWorker({
		id,
		status,
		isNbTaskUpdate,
		currentTaskId,
	}: UpdateWorkerParams) {
		const logger = getLoggerStore();
		logger.info({ id, status, isNbTaskUpdate, currentTaskId }, "worker update");
		const [updatedWorker] = await this.drizzle
			.update(workersTable)
			.set({
				...(isNbTaskUpdate
					? { tasksDone: sql`${workersTable.tasksDone} + 1` }
					: {}),
				currentTaskId,
				status,
			})
			.where(eq(workersTable.id, id))
			.returning();

		if (!updatedWorker) {
			logger.error({ id, status, isNbTaskUpdate, currentTaskId }, "failed to update worker");
			throw new Error("failed to update worker");
		}

		return updatedWorker;
	}

	async deleteWorker(id: string) {
		const logger = getLoggerStore();
		logger.info({ id }, "delete worker");
		const [deletedWorker] = await this.drizzle
			.delete(workersTable)
			.where(eq(workersTable.id, id))
			.returning();

		if (!deletedWorker) {
			logger.error({ id }, "failed to delete worker");
			throw new Error("failed to delete worker");
		}

		return deletedWorker;
	}
}
