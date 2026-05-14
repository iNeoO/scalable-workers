import { type Database, db } from "@sw/drizzle";
import { env } from "@sw/infra/config";
import { factory, type Redis } from "@sw/infra/libs";
import { RedisService, StatsService, TasksService, WorkersService } from "@sw/services";
import { TaskProvider } from "@sw/task-worker/provider";

export type AppServices = {
	redis: Redis;
	drizzle: Database;
	workersService: WorkersService;
	tasksService: TasksService;
	redisService: RedisService;
	statsService: StatsService;
};

export const createServices = async (): Promise<AppServices> => {
	const redis = await factory.create({
		host: env.REDIS_SW_HOST,
		port: env.REDIS_SW_PORT,
		username: env.REDIS_SW_USERNAME,
		password: env.REDIS_SW_PASSWORD,
	});
	const redisService = new RedisService(redis);
	const statsService = new StatsService(redisService, env.AMQP_URL, env.AMQP_QUEUE);
	const taskProvider = new TaskProvider(env.AMQP_URL, env.AMQP_QUEUE);
	const workersService = new WorkersService(db);

	await Promise.all([statsService.init(), taskProvider.init()]);

	const tasksService = new TasksService(db, taskProvider, redisService, statsService);

	return {
		redis,
		drizzle: db,
		workersService,
		tasksService,
		redisService,
		statsService,
	};
};
