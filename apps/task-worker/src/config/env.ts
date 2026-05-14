import { AmqpEnvSchema, RedisEnvSchema } from "@sw/common/config";
import { z } from "zod";

const EnvSchema = RedisEnvSchema.extend({
	...AmqpEnvSchema.shape,
	WORKER_ID: z.string(),
});

export const env = EnvSchema.parse(process.env);
