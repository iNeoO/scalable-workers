import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/db/schema.table.ts",
	dbCredentials: {
		// biome-ignore lint/style/noNonNullAssertion: variable will be provided
		url: process.env.PG_URL!,
	},
});
