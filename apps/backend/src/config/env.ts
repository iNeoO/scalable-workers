import { AmqpEnvSchema, RedisEnvSchema } from "@sw/infra/config";
import { z } from "zod";

const EnvSchema = RedisEnvSchema.extend({
	...AmqpEnvSchema.shape,
	PG_URL: z.string(),
});

export const env = EnvSchema.parse(process.env);
