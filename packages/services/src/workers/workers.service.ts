import { type Database, workersTable } from "@sw/drizzle";
import type { CreateWorkerParams } from "./workers.type.js";

export class WorkersService {
	private readonly drizzle: Database;

	constructor(drizzle: Database) {
		this.drizzle = drizzle;
	}

	async getWorkers() {
		return await this.drizzle.select().from(workersTable);
	}

	async createWorker(worker: CreateWorkerParams) {
		await this.drizzle.insert(workersTable).values(worker);
	}
}
