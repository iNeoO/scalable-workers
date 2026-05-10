import { getLoggerStore } from "@sw/infra/libs";
import amqp from "amqplib";

export class TaskProvider {
	private queue: string;
	private url: string;
	private connection?: amqp.ChannelModel;
	private channel?: amqp.Channel;

	constructor(url: string, queue: string) {
		this.queue = queue;
		this.url = url;
	}

	async init() {
		this.connection = await amqp.connect(this.url);
		this.channel = await this.connection.createChannel();
		await this.channel.assertQueue(this.queue, {
			durable: true,
			arguments: {
				"x-queue-type": "quorum",
			},
		});
	}

	send(id: string) {
		if (!this.channel || !this.queue) {
			const logger = getLoggerStore();
			logger.error(
				{ channel: this.channel, queue: this.queue },
				"missing provider init()",
			);
			throw new Error("missing provider init()");
		}
		this.channel.sendToQueue(this.queue, Buffer.from(id), {
			persistent: true,
		});
	}

	async close() {
		if (this.connection) {
			return await this.connection.close();
		}
	}
}
