import { TASK_EVENTS, TASKS_STATUS, WORKERS_STATUS } from "@sw/common/constants";
import {
	createWorkerLogger,
	type PinoLogger,
	wrapWithLogger,
} from "@sw/infra/libs";
import type {
	RedisService,
	StatsService,
	TasksService,
	WorkersService,
} from "@sw/services";
import amqp from "amqplib";

type Task = NonNullable<Awaited<ReturnType<TasksService["getTask"]>>>;

export class TaskConsumer {
	private queue: string;
	private url: string;
	private id: string;
	private tasksService: TasksService;
	private workersService: WorkersService;
	private redisService: RedisService;
	private statsService: StatsService;
	private logger: PinoLogger;
	private consumerTag?: string;
	private currentTask?: Promise<void>;
	private connection?: amqp.ChannelModel;
	private channel?: amqp.Channel;

	constructor(
		id: string,
		url: string,
		queue: string,
		taskServices: TasksService,
		workersServices: WorkersService,
		redisService: RedisService,
		statsService: StatsService,
	) {
		this.id = id;
		this.url = url;
		this.queue = queue;
		this.tasksService = taskServices;
		this.workersService = workersServices;
		this.redisService = redisService;
		this.statsService = statsService;
		this.logger = createWorkerLogger({
			workerId: this.id,
			reqId: crypto.randomUUID(),
		});
	}

	async init() {
		this.connection = await amqp.connect(this.url);
		const channel = await this.connection.createChannel();
		this.channel = channel;

		const dlx = `${this.queue}.dlx`;
		const dlq = `${this.queue}.dlq`;
		const dlRoutingKey = `${this.queue}.dead`;

		await channel.assertExchange(dlx, "direct", {
			durable: true,
		});

		await channel.assertQueue(dlq, {
			durable: true,
		});

		await channel.bindQueue(dlq, dlx, dlRoutingKey);

		await channel.assertQueue(this.queue, {
			durable: true,
			arguments: {
				"x-dead-letter-exchange": dlx,
				"x-dead-letter-routing-key": dlRoutingKey,
			},
		});

		channel.prefetch(1);
		await this.registerWorker();
		const consumer = await channel.consume(this.queue, async (msg) => {
			if (!msg) {
				this.logger.warn({ queue: this.queue }, "consumer was cancelled");
				return;
			}

			this.currentTask = this.handleMessage(channel, msg).finally(() => {
				this.currentTask = undefined;
			});
		});

		this.consumerTag = consumer.consumerTag;
	}

	private async handleMessage(channel: amqp.Channel, msg: amqp.ConsumeMessage) {
		const id = this.getTaskIdFromMessage(msg);
		if (!id) {
			this.logger.error({ queue: this.queue }, "id is empty");
			channel.nack(msg, false, false);
			return;
		}

		const logger = this.logger.child({ taskId: id });

		try {
			await wrapWithLogger(logger, () => this.handler(id));
			channel.ack(msg);
		} catch (err) {
			this.logger.error({ err, taskId: id }, "task failed");
			channel.nack(msg, false, false);
		}
	}

	private async registerWorker() {
		const worker = await this.workersService.updateWorker({
			id: this.id,
			status: WORKERS_STATUS.IDLE,
			isNbTaskUpdate: false,
			currentTaskId: null,
		});
		await Promise.all([
			this.redisService.incrementWorkerCount(),
			this.redisService.publishWorker(worker, "created"),
		]);
		await this.statsService.publishStats();
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

	private getTaskIdFromMessage(msg: amqp.ConsumeMessage | null) {
		return msg?.content.toString();
	}

	async handler(id: string) {
		const task = await this.getTask(id);
		if (!task) {
			throw new Error("task not found");
		}
		await this.startTask(id);
		const start = Date.now();
		await this.waitTaskDuration(task);
		const duration = Date.now() - start;
		await this.finishTask(task.id, duration);
		await this.releaseWorker();
	}

	private async getTask(id: string) {
		const task = await this.tasksService.getTask(id);
		if (task) return task;

		this.logger.error({ id }, "task not found");
	}

	private async startTask(id: string) {
		await this.setWorkerBusy(id);
		const task = await this.tasksService.processTask({
			id,
			status: TASKS_STATUS.RUNNING,
			processedBy: this.id,
		});
		await this.redisService.decrementTaskWaiting();
		await Promise.all([
			this.redisService.publishTask(task, TASK_EVENTS.STARTED),
			this.statsService.publishStats(),
		]);
	}

	private async setWorkerBusy(taskId: string) {
		const worker = await this.workersService.updateWorker({
			id: this.id,
			status: WORKERS_STATUS.BUSY,
			isNbTaskUpdate: false,
			currentTaskId: taskId,
		});
		await this.redisService.publishWorker(worker, "updated");
	}

	private async waitTaskDuration(task: Task) {
		await new Promise((resolve) => setTimeout(resolve, task.durationMs));
	}

	private async finishTask(id: string, duration: number) {
		const task = await this.tasksService.processTask({
			id,
			processedBy: this.id,
			status: TASKS_STATUS.FINISHED,
		});
		await Promise.all([
			this.redisService.incrementAverageTimeByTask(duration),
			this.redisService.publishTask(task, TASK_EVENTS.FINISHED),
		]);
		await this.statsService.publishStats();
	}

	private async releaseWorker() {
		const worker = await this.workersService.updateWorker({
			id: this.id,
			status: WORKERS_STATUS.IDLE,
			isNbTaskUpdate: true,
			currentTaskId: null,
		});
		await this.redisService.publishWorker(worker, "updated");
	}

	async end() {
		if (this.channel && this.consumerTag) {
			await this.channel.cancel(this.consumerTag);
		}

		if (this.currentTask) {
			await this.currentTask;
		}

		if (this.channel) {
			await this.channel.close();
		}

		if (this.connection) {
			await this.connection.close();
		}

		const worker = await this.workersService.deleteWorker(this.id);
		await Promise.all([
			this.redisService.decrementWorkerCount(),
			this.redisService.publishWorker(worker, "removed"),
		]);
		await this.statsService.publishStats();
	}
}
