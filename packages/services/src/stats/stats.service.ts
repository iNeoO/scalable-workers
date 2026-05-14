import amqp from "amqplib";
import type { RedisService } from "../redis/redis.service";

export class StatsService {
	redisService: RedisService;
	private queue: string;
	private url: string;
	private connection?: amqp.ChannelModel;
	private channel?: amqp.Channel;

	constructor(RedisService: RedisService, url: string, queue: string) {
		this.redisService = RedisService;
		this.url = url;
		this.queue = queue;
	}

	async init() {
		this.connection = await amqp.connect(this.url);
		const channel = await this.connection.createChannel();
		this.channel = channel;
	}

	async getDeadLetterQueueCount() {
		if (!this.channel) {
			throw new Error("channel is not initialized");
		}

		const dlq = `${this.queue}.dlq`;
		const queue = await this.channel.checkQueue(dlq);

		return queue.messageCount;
	}

	async getQueueCount() {
		if (!this.channel) {
			throw new Error("channel is not initialized");
		}

		const queue = await this.channel.checkQueue(this.queue);

		return queue.messageCount;
	}

	async getStats() {
		const [stats, queueCount, deadLetterQueueCount] = await Promise.all([
			this.redisService.stats(),
			this.getQueueCount(),
			this.getDeadLetterQueueCount(),
		]);
		return {
			...stats,
			queueCount,
			deadLetterQueueCount,
		};
	}

	async publishStats() {
		const stats = await this.getStats();
		await this.redisService.publishStats(stats);
	}

	async end() {
		if (this.channel) {
			await this.channel.close();
		}

		if (this.connection) {
			await this.connection.close();
		}
	}
}
