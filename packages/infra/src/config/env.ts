import { AmqpEnvSchema, RedisEnvSchema } from "@sw/common/config";

const EnvSchema = RedisEnvSchema.extend(AmqpEnvSchema.shape);

export const env = EnvSchema.parse(process.env);
