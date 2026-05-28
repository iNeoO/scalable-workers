import { env as backendEnv } from "../../../config/env.js";

const DEFAULT_WORKER_DOCKER_IMAGE = "sw-worker:latest";
const DEFAULT_WORKER_DOCKER_NETWORK = "scalable-workers_default";
const DEFAULT_WORKER_AMQP_HOST = "rabbitmq";
const DEFAULT_WORKER_AMQP_PORT = "5672";
const DEFAULT_WORKER_PG_HOST = "postgres";
const DEFAULT_WORKER_PG_PORT = "5432";
const DEFAULT_WORKER_REDIS_HOST = "redis";
const DEFAULT_WORKER_REDIS_PORT = "6379";

const optionalEnv = (value: string | undefined) =>
	value === undefined || value === "" ? undefined : value;

const rewriteUrlEndpoint = (value: string, host: string, port: string) => {
	const url = new URL(value);
	url.hostname = host;
	url.port = port;
	return url.toString();
};

export const workerEnv = {
	dockerImage:
		optionalEnv(process.env.WORKER_DOCKER_IMAGE) ?? DEFAULT_WORKER_DOCKER_IMAGE,
	dockerNetwork:
		optionalEnv(process.env.WORKER_DOCKER_NETWORK) ??
		DEFAULT_WORKER_DOCKER_NETWORK,
	amqpQueue: backendEnv.AMQP_QUEUE,
	amqpUrl:
		optionalEnv(process.env.WORKER_AMQP_URL) ??
		rewriteUrlEndpoint(
			backendEnv.AMQP_URL,
			DEFAULT_WORKER_AMQP_HOST,
			DEFAULT_WORKER_AMQP_PORT,
		),
	pgUrl:
		optionalEnv(process.env.WORKER_PG_URL) ??
		rewriteUrlEndpoint(
			backendEnv.PG_URL,
			DEFAULT_WORKER_PG_HOST,
			DEFAULT_WORKER_PG_PORT,
		),
	redisHost:
		optionalEnv(process.env.WORKER_REDIS_SW_HOST) ?? DEFAULT_WORKER_REDIS_HOST,
	redisPort:
		optionalEnv(process.env.WORKER_REDIS_SW_PORT) ?? DEFAULT_WORKER_REDIS_PORT,
	redisUsername: optionalEnv(backendEnv.REDIS_SW_USERNAME),
	redisPassword: optionalEnv(backendEnv.REDIS_SW_PASSWORD),
};
