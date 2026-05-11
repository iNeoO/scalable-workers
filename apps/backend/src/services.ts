import { type Database, db } from "@sw/drizzle";
import { TasksService, WorkersService } from "@sw/services";

export type AppServices = {
	drizzle: Database;
	workersService: WorkersService;
	tasksService: TasksService;
};

export const createServices = (): AppServices => {
	const workersService = new WorkersService(db);
	const tasksService = new TasksService(db);

	return {
		drizzle: db,
		workersService,
		tasksService,
	};
};
