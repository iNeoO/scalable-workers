import {
	integer,
	pgEnum,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("mood", ["sad", "ok", "happy"]);

export const tasksTable = pgTable("tasks", {
	id: uuid().primaryKey().defaultRandom(),
	duration: integer(),
	enum: statusEnum(),
	processedBy: varchar({ length: 255 }),
	createdAt: timestamp().defaultNow().notNull(),
	updatedAt: timestamp(),
});
1;
