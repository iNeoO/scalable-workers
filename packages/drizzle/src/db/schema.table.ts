import {
	foreignKey,
	integer,
	type PgTableExtraConfigValue,
	pgEnum,
	pgTable,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const taskStatusEnum = pgEnum("tasksStatus", [
	"pending",
	"running",
	"finished",
]);

export const workerStatusEnum = pgEnum("workerStatus", ["idle", "busy"]);

export const workersTable = pgTable(
	"workers",
	{
		id: uuid().primaryKey().defaultRandom(),
		status: workerStatusEnum().notNull(),
		tasksDone: integer().notNull(),
		currentTaskId: uuid(),
		createdAt: timestamp().defaultNow().notNull(),
	},
	(table): PgTableExtraConfigValue[] => [
		foreignKey({
			columns: [table.currentTaskId],
			foreignColumns: [tasksTable.id],
			name: "workers_current_task_fk",
		}),
	],
);

export const tasksTable = pgTable(
	"tasks",
	{
		id: uuid().primaryKey().defaultRandom(),
		duration: integer().notNull(),
		status: taskStatusEnum().notNull(),
		processedBy: uuid(),
		createdAt: timestamp().defaultNow().notNull(),
		updatedAt: timestamp().defaultNow().notNull(),
	},
	(table): PgTableExtraConfigValue[] => [
		foreignKey({
			columns: [table.processedBy],
			foreignColumns: [workersTable.id],
			name: "tasks_processed_by_fk",
		}),
	],
);
