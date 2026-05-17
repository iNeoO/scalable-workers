import { TASKS_STATUS, WORKERS_STATUS } from "@sw/common/constants";
import {
	and,
	type Database,
	eq,
	isNull,
	tasksTable,
	workersTable,
} from "@sw/drizzle";
import { getLoggerStore } from "@sw/infra/libs";
import type { CreateWorkerParams, UpdateWorkerParams } from "./workers.type.js";

export class WorkersService {
	private readonly drizzle: Database;

	constructor(drizzle: Database) {
		this.drizzle = drizzle;
	}

	private async getWorkerWithRelations(id: string) {
		return await this.drizzle.query.workersTable.findFirst({
			where: and(eq(workersTable.id, id), isNull(workersTable.deletedAt)),
			with: {
				currentTask: true,
				processedTasks: {
					where: eq(tasksTable.status, TASKS_STATUS.FINISHED),
				},
			},
		});
	}

	async getWorkers() {
		return await this.drizzle.query.workersTable.findMany({
			where: isNull(workersTable.deletedAt),
			with: {
				currentTask: true,
				processedTasks: {
					where: eq(tasksTable.status, TASKS_STATUS.FINISHED),
				},
			},
		});
	}

	async createWorker(worker: CreateWorkerParams) {
		const logger = getLoggerStore();
		const [createdWorker] = await this.drizzle
			.insert(workersTable)
			.values(worker)
			.returning();

		if (!createdWorker) {
			logger.error({ worker }, "failed to create worker");
			throw new Error("failed to create worker");
		}

		const hydratedWorker = await this.getWorkerWithRelations(createdWorker.id);
		if (!hydratedWorker) {
			logger.error(
				{ workerId: createdWorker.id },
				"failed to hydrate created worker",
			);
			throw new Error("failed to hydrate created worker");
		}

		return hydratedWorker;
	}

	async updateWorker({ id, status, currentTaskId }: UpdateWorkerParams) {
		const logger = getLoggerStore();
		logger.info({ id, status, currentTaskId }, "worker update");
		const [updatedWorker] = await this.drizzle
			.update(workersTable)
			.set({
				currentTaskId,
				status,
			})
			.where(eq(workersTable.id, id))
			.returning();

		if (!updatedWorker) {
			logger.error({ id, status, currentTaskId }, "failed to update worker");
			throw new Error("failed to update worker");
		}

		const hydratedWorker = await this.getWorkerWithRelations(updatedWorker.id);
		if (!hydratedWorker) {
			logger.error(
				{ workerId: updatedWorker.id },
				"failed to hydrate updated worker",
			);
			throw new Error("failed to hydrate updated worker");
		}

		return hydratedWorker;
	}

	async deleteWorker(id: string) {
		const logger = getLoggerStore();
		logger.info({ id }, "delete worker");
		const [deletedWorker] = await this.drizzle
			.update(workersTable)
			.set({
				deletedAt: new Date(),
			})
			.where(eq(workersTable.id, id))
			.returning();

		if (!deletedWorker) {
			logger.error({ id }, "failed to delete worker");
			throw new Error("failed to delete worker");
		}

		return deletedWorker;
	}

	async hardDeleteWorker(id: string) {
		const logger = getLoggerStore();
		logger.info({ id }, "hard delete worker");
		const [deletedWorker] = await this.drizzle
			.delete(workersTable)
			.where(eq(workersTable.id, id))
			.returning();

		if (!deletedWorker) {
			logger.error({ id }, "failed to hard delete worker");
			throw new Error("failed to hard delete worker");
		}

		return deletedWorker;
	}

	async shutdownWorker(id: string) {
		const logger = getLoggerStore();
		logger.info({ id }, "shutdown worker");
		const [updatedWorker] = await this.drizzle
			.update(workersTable)
			.set({
				status: WORKERS_STATUS.SHUTDOWN,
			})
			.where(eq(workersTable.id, id))
			.returning();

		if (!updatedWorker) {
			logger.error({ id }, "failed to shutdown worker");
			throw new Error("failed to shutdown worker");
		}

		const hydratedWorker = await this.getWorkerWithRelations(updatedWorker.id);
		if (!hydratedWorker) {
			logger.error(
				{ workerId: updatedWorker.id },
				"failed to hydrate shutdown worker",
			);
			throw new Error("failed to hydrate shutdown worker");
		}

		return hydratedWorker;
	}
}
