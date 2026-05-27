import { env as backendEnv } from "../../../config/env.js";

const DEFAULT_WORKER_DOCKER_IMAGE = "sw-worker:latest";
const DEFAULT_WORKER_DOCKER_NETWORK = "scalable-workers_default";

const rewriteUrlHost = (value: string, host: string, port: string) => {
	const url = new URL(value);
	url.hostname = host;
	url.port = port;
	return url.toString();
};

export const workerEnv = {
	dockerImage: process.env.WORKER_DOCKER_IMAGE ?? DEFAULT_WORKER_DOCKER_IMAGE,
	dockerNetwork:
		process.env.WORKER_DOCKER_NETWORK ?? DEFAULT_WORKER_DOCKER_NETWORK,
	amqpQueue: backendEnv.AMQP_QUEUE,
	amqpUrl:
		process.env.WORKER_AMQP_URL ??
		rewriteUrlHost(backendEnv.AMQP_URL, "rabbitmq", "5672"),
	pgUrl:
		process.env.WORKER_PG_URL ??
		rewriteUrlHost(backendEnv.PG_URL, "postgres", "5432"),
	redisHost: process.env.WORKER_REDIS_SW_HOST ?? "redis",
	redisPort: process.env.WORKER_REDIS_SW_PORT ?? "6379",
	redisUsername: backendEnv.REDIS_SW_USERNAME,
	redisPassword: backendEnv.REDIS_SW_PASSWORD,
};
