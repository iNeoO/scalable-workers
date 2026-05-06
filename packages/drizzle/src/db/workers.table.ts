import {
	integer,
	pgEnum,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

const statusEnum = pgEnum(["idle", "busy"]);

export const workersTable = pgTable("workers", {
	id: uuid().primaryKey().defaultRandom(),
	status,
});
