import { db } from "@sw/drizzle";
import { factory, pinoLogger } from "@sw/infra/libs";
import {
	RedisService,
	StatsService,
	TasksService,
	WorkersService,
} from "@sw/services";
import { env } from "./config/env.js";
import { TaskConsumer } from "./consumer/index.js";
import { TaskProvider } from "./provider/index.js";

const main = async (id: string, url: string, queue: string) => {
	const redis = await factory.create({
		host: env.REDIS_SW_HOST,
		port: env.REDIS_SW_PORT,
		username: env.REDIS_SW_USERNAME,
		password: env.REDIS_SW_PASSWORD,
	});
	const redisService = new RedisService(redis);
	const statsService = new StatsService(redisService, url, queue);
	const taskProvider = new TaskProvider(url, queue);
	const tasksServices = new TasksService(
		db,
		taskProvider,
		redisService,
		statsService,
	);
	const workersServices = new WorkersService(db);

	const taskConsumer = new TaskConsumer(
		id,
		url,
		queue,
		tasksServices,
		workersServices,
		redisService,
		statsService,
	);

	await statsService.init();
	await taskConsumer.init();

	let isShuttingDown = false;

	const gracefulShutdown = async (signal: string) => {
		if (isShuttingDown) return;
		isShuttingDown = true;
		pinoLogger.info(`${signal} received. Graceful shutdown initiated.`);
		await taskConsumer.end();
		await statsService.end();
		await db.$client.end();
		process.exit(0);
	};

	process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
	process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};

main(env.WORKER_ID, env.AMQP_URL, env.AMQP_QUEUE);
