import type {
	Stats,
	StatsChannel,
	Task,
	TaskChannel,
	Worker,
	WorkerChannel,
} from "@sw/services";

export type SseMessage =
	| {
			event: StatsChannel;
			data: { stats: Stats };
	  }
	| {
			event: TaskChannel;
			data: { task: Task };
	  }
	| {
			event: WorkerChannel;
			data: { worker: Worker };
	  };
