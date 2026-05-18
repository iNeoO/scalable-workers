import { AmqpEnvSchema, RedisEnvSchema } from "@sw/infra/config";

const EnvSchema = RedisEnvSchema.extend({
	...AmqpEnvSchema.shape,
});

export const env = EnvSchema.parse(process.env);
