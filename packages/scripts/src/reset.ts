import { resolve } from "node:path";
import amqp from "amqplib";
import { config } from "dotenv";
import Redis from "ioredis";
import { Client } from "pg";

config({ path: resolve(import.meta.dir, "../../../.env") });

const redisStatsKeys = [
	"tasksProcessed",
	"tasksWaiting",
	"workersCount",
	"totalTimeByTask",
];

const requiredEnv = (key: string) => {
	const value = process.env[key];
	if (!value) {
		throw new Error(`${key} is required`);
	}
	return value;
};

const optionalEnv = (key: string) => {
	const value = process.env[key];
	return value === undefined || value === "" ? undefined : value;
};

const parsePort = (value: string, key: string) => {
	const port = Number.parseInt(value, 10);
	if (Number.isNaN(port)) {
		throw new Error(`${key} must be a valid number`);
	}
	return port;
};

const quoteIdentifier = (value: string) => `"${value.replaceAll('"', '""')}"`;

const deadLetterQueue = (queue: string) => `${queue}.dlq`;
const deadLetterExchange = (queue: string) => `${queue}.dlx`;
const deadLetterRoutingKey = (queue: string) => `${queue}.dead`;

const ensureQueueTopology = async (channel: amqp.Channel, queue: string) => {
	const dlx = deadLetterExchange(queue);
	const dlq = deadLetterQueue(queue);
	const dlRoutingKey = deadLetterRoutingKey(queue);

	await channel.assertExchange(dlx, "direct", { durable: true });
	await channel.assertQueue(dlq, { durable: true });
	await channel.bindQueue(dlq, dlx, dlRoutingKey);
	await channel.assertQueue(queue, {
		durable: true,
		arguments: {
			"x-dead-letter-exchange": dlx,
			"x-dead-letter-routing-key": dlRoutingKey,
		},
	});
};

const closeWithTimeout = async (
	label: string,
	close: () => void | Promise<void>,
) => {
	const timeoutMs = 1_000;
	let timeout: ReturnType<typeof setTimeout> | undefined;

	await Promise.race([
		Promise.resolve()
			.then(close)
			.catch((err) => {
				console.warn(`Failed to close ${label}:`, err);
			}),
		new Promise<void>((resolve) => {
			timeout = setTimeout(() => {
				console.warn(`Timed out closing ${label}.`);
				resolve();
			}, timeoutMs);
			timeout.unref?.();
		}),
	]);

	if (timeout) {
		clearTimeout(timeout);
	}
};

const main = async () => {
	const pgUrl = requiredEnv("PG_URL");
	const amqpUrl = requiredEnv("AMQP_URL");
	const amqpQueue = requiredEnv("AMQP_QUEUE");
	const redisHost = requiredEnv("REDIS_SW_HOST");
	const redisPort = parsePort(requiredEnv("REDIS_SW_PORT"), "REDIS_SW_PORT");

	const client = new Client({ connectionString: pgUrl });
	const redis = new Redis({
		host: redisHost,
		port: redisPort,
		username: optionalEnv("REDIS_SW_USERNAME"),
		password: optionalEnv("REDIS_SW_PASSWORD"),
		lazyConnect: true,
		maxRetriesPerRequest: 1,
	});
	let amqpConnection: amqp.ChannelModel | undefined;
	let amqpChannel: amqp.Channel | undefined;

	try {
		await Promise.all([client.connect(), redis.connect()]);
		amqpConnection = await amqp.connect(amqpUrl);
		amqpChannel = await amqpConnection.createChannel();
		await ensureQueueTopology(amqpChannel, amqpQueue);

		const { rows } = await client.query<{ tablename: string }>(`
			SELECT tablename
			FROM pg_tables
			WHERE schemaname = 'public'
		`);

		if (rows.length > 0) {
			const tables = rows
				.map(
					({ tablename }) =>
						`${quoteIdentifier("public")}.${quoteIdentifier(tablename)}`,
				)
				.join(", ");

			await client.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
		}

		await redis.del(...redisStatsKeys);
		await Promise.all([
			amqpChannel.purgeQueue(amqpQueue),
			amqpChannel.purgeQueue(deadLetterQueue(amqpQueue)),
		]);

		console.log(
			`Reset ${rows.length} public table(s), ${redisStatsKeys.length} Redis stats key(s), and RabbitMQ queues "${amqpQueue}" + "${deadLetterQueue(amqpQueue)}".`,
		);
	} finally {
		await closeWithTimeout("RabbitMQ channel", () => amqpChannel?.close());
		await closeWithTimeout("RabbitMQ connection", () =>
			amqpConnection?.close(),
		);
		await closeWithTimeout("Postgres client", () => client.end());
		await closeWithTimeout("Redis client", () => redis.disconnect());
	}
};

let exitCode = 0;

try {
	await main();
} catch (err) {
	exitCode = 1;
	console.error(err);
} finally {
	process.exit(exitCode);
}
