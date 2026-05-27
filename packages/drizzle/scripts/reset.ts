import { resolve } from "node:path";
import { config } from "dotenv";
import { Client } from "pg";

config({ path: resolve(import.meta.dir, "../../../.env") });

const pgUrl = process.env.PG_URL;

if (!pgUrl) {
	throw new Error("PG_URL is required to reset the database");
}

const quoteIdentifier = (value: string) => `"${value.replaceAll('"', '""')}"`;

const client = new Client({ connectionString: pgUrl });

try {
	await client.connect();

	const { rows } = await client.query<{ tablename: string }>(`
		SELECT tablename
		FROM pg_tables
		WHERE schemaname = 'public'
	`);

	if (rows.length === 0) {
		console.log("No public tables to reset.");
		process.exit(0);
	}

	const tables = rows
		.map(({ tablename }) => `${quoteIdentifier("public")}.${quoteIdentifier(tablename)}`)
		.join(", ");

	await client.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);

	console.log(`Reset ${rows.length} public table(s).`);
} finally {
	await client.end();
}
