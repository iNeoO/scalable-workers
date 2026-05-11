import {
	createWorkerLogger,
	getLoggerStore,
	pinoLogger,
	wrapWithLogger,
} from "@sw/infra/libs";
import type { TasksService, WorkersService } from "@sw/services";
import amqp from "amqplib";

type Task = NonNullable<Awaited<ReturnType<TasksService["getTask"]>>>;

export class TaskConsumer {
	private queue: string;
	private url: string;
	private connection?: amqp.ChannelModel;
	private channel?: amqp.Channel;
	private tasksService: TasksService;
	private workersService: WorkersService;
	private id: string;

	constructor(
		id: string,
		url: string,
		queue: string,
		taskServices: TasksService,
		workersServices: WorkersService,
	) {
		this.id = id;
		this.url = url;
		this.queue = queue;
		this.tasksService = taskServices;
		this.workersService = workersServices;
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
		this.channel.prefetch(1);
		await this.registerWorker();
		this.channel.consume(this.queue, async (msg) => {
			const id = this.getTaskIdFromMessage(msg);
			if (!id) {
				pinoLogger.error({ queue: this.queue }, "id is empty");
				return;
			}
			const logger = createWorkerLogger({
				workerId: this.id,
				reqId: crypto.randomUUID(),
				taskId: id,
			});

			return await wrapWithLogger(logger, () => this.handler(id));
		});
	}

	private async registerWorker() {
		await this.workersService.updateWorker({
			id: this.id,
			status: "idle",
			isNbTaskUpdate: false,
			currentTaskId: null,
		});
	}

	private getTaskIdFromMessage(msg: amqp.ConsumeMessage | null) {
		return msg?.content.toString();
	}

	async handler(id: string) {
		const task = await this.getTask(id);
		if (!task) return;

		await this.startTask(id);
		await this.waitTaskDuration(task);
		await this.finishTask(task.id);
		await this.releaseWorker(id);
	}

	private async getTask(id: string) {
		const task = await this.tasksService.getTask(id);
		if (task) return task;

		const logger = getLoggerStore();
		logger.error({ id }, "task not found");
	}

	private async startTask(id: string) {
		await this.setWorkerBusy(id);
		await this.tasksService.processTask({
			id,
			status: "running",
			processedBy: this.id,
		});
	}

	private async setWorkerBusy(taskId: string) {
		await this.workersService.updateWorker({
			id: this.id,
			status: "busy",
			isNbTaskUpdate: false,
			currentTaskId: taskId,
		});
	}

	private async waitTaskDuration(task: Task) {
		await new Promise((resolve) => setTimeout(resolve, task.duration));
	}

	private async finishTask(id: string) {
		await this.tasksService.processTask({
			id,
			processedBy: this.id,
			status: "finished",
		});
	}

	private async releaseWorker(taskId: string) {
		await this.workersService.updateWorker({
			id: this.id,
			status: "idle",
			isNbTaskUpdate: true,
			currentTaskId: taskId,
		});
	}
}
