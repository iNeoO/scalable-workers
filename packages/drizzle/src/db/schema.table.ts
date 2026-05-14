import { TASKS_STATUS, WORKERS_STATUS } from "@sw/common/constants";
import { relations } from "drizzle-orm";
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
	TASKS_STATUS.PENDING,
	TASKS_STATUS.RUNNING,
	TASKS_STATUS.FINISHED,
]);

export const workerStatusEnum = pgEnum("workerStatus", [
	WORKERS_STATUS.BOOT,
	WORKERS_STATUS.IDLE,
	WORKERS_STATUS.BUSY,
	WORKERS_STATUS.SHUTDOWN,
]);

export const workersTable = pgTable(
	"workers",
	{
		id: uuid().primaryKey().defaultRandom(),
		status: workerStatusEnum().notNull(),
		tasksDone: integer().notNull(),
		currentTaskId: uuid(),
		createdAt: timestamp().defaultNow().notNull(),
		deletedAt: timestamp(),
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
		durationMs: integer().notNull(),
		status: taskStatusEnum().notNull(),
		processedBy: uuid(),
		createdAt: timestamp().defaultNow().notNull(),
		updatedAt: timestamp().defaultNow().notNull(),
		startedAt: timestamp(),
		finishedAt: timestamp(),
	},
	(table): PgTableExtraConfigValue[] => [
		foreignKey({
			columns: [table.processedBy],
			foreignColumns: [workersTable.id],
			name: "tasks_processed_by_fk",
		}),
	],
);

export const workersRelations = relations(workersTable, ({ many, one }) => ({
	currentTask: one(tasksTable, {
		fields: [workersTable.currentTaskId],
		references: [tasksTable.id],
		relationName: "workers_current_task",
	}),
	processedTasks: many(tasksTable, {
		relationName: "workers_processed_tasks",
	}),
}));

export const tasksRelations = relations(tasksTable, ({ many, one }) => ({
	currentForWorkers: many(workersTable, {
		relationName: "workers_current_task",
	}),
	processedByWorker: one(workersTable, {
		fields: [tasksTable.processedBy],
		references: [workersTable.id],
		relationName: "workers_processed_tasks",
	}),
}));
