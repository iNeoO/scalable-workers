import { type Database, tasksTable } from "@sw/drizzle";
import { getLoggerStore } from "../../../infra/src/libs/asyncLocalStorage";
import type { CreateTaskParams } from "./tasks.type.js";

export class TasksService {
	private readonly drizzle: Database;

	constructor(drizzle: Database) {
		this.drizzle = drizzle;
	}

	async getTasks() {
		return await this.drizzle.select().from(tasksTable);
	}

	async createTask(task: CreateTaskParams) {
		const logger = getLoggerStore();
		logger.info({ task }, "New task");
		return await this.drizzle.insert(tasksTable).values(task).returning();
	}
}
