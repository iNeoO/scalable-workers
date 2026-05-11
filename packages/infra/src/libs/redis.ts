import Redis from "ioredis";
import { pinoLogger } from "./pino";

const logger = pinoLogger.child({ from: "redis" });

export const initRedis = async ({
	host,
	port,
	username,
	password,
}: {
	host: string;
	port: number;
	username?: string;
	password?: string;
}) => {
	const redis = new Redis({
		host,
		port,
		username,
		password,
		lazyConnect: true,
		retryStrategy: (t) => Math.min(200 * t, 2000),
		maxRetriesPerRequest: 1,
	});

	redis.on("error", (err) => {
		logger.error({ err }, "Error connecting to redis");
	});

	try {
		await redis.connect();
		return redis;
	} catch (err) {
		redis.disconnect();
		throw err;
	}
};

export const factory = {
	create: initRedis,
	destroy: (client: Redis) => client.quit(),
};
