import { z } from "zod";

export const RedisEnvSchema = z.object({
	REDIS_SW_HOST: z.string(),
	REDIS_SW_PORT: z.coerce.number(),
	REDIS_SW_PASSWORD: z.string().optional(),
	REDIS_SW_USERNAME: z.string().optional(),
});

export const AmqpEnvSchema = z.object({
	AMQP_URL: z.string(),
	AMQP_QUEUE: z.string(),
});
