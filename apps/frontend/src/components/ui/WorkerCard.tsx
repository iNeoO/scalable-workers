import { ActionIcon, Card, Group, Text, Tooltip } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { WORKERS_STATUS } from "@sw/common/constants";
import { useDeleteWorker } from "../../hooks/workers.hook";
import type { getWorkers } from "../../libs/api/workers.api";
import { WorkerBadge } from "./WorkerBadge";

type Worker = Awaited<ReturnType<typeof getWorkers>>[number];

type WorkerCardProps = {
	worker: Worker;
};

const shortId = (value: string) => value.slice(0, 6);

const formatCreatedAt = (value: Date | string) =>
	new Intl.DateTimeFormat("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(new Date(value));

const TrashIcon = () => {
	return (
		<svg
			aria-hidden="true"
			fill="none"
			height="16"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.8"
			viewBox="0 0 24 24"
			width="16"
		>
			<path d="M3 6h18" />
			<path d="M8 6V4h8v2" />
			<path d="M19 6l-1 14H6L5 6" />
			<path d="M10 11v6" />
			<path d="M14 11v6" />
		</svg>
	);
};

export const WorkerCard = ({ worker }: WorkerCardProps) => {
	const deleteWorkerMutation = useDeleteWorker();
	const currentTaskLabel = worker.currentTask
		? shortId(worker.currentTask.id)
		: "---";
	const completedTasks = worker.processedTasks.length;
	const canDeleteWorker = worker.status !== WORKERS_STATUS.SHUTDOWN;

	const handleDelete = () => {
		modals.openConfirmModal({
			centered: true,
			title: "Delete worker",
			children: (
				<Text size="sm">
					Are you sure you want to delete worker {shortId(worker.id)}?
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: async () => {
				try {
					await deleteWorkerMutation.mutateAsync(worker.id);
					notifications.show({
						color: "green",
						message: `Worker ${shortId(worker.id)} deleted`,
						title: "Worker deleted",
					});
				} catch (error) {
					const message =
						error instanceof Error ? error.message : "Failed to delete worker";
					notifications.show({
						color: "red",
						message,
						title: "Delete failed",
					});
				}
			},
		});
	};

	return (
		<Card
			className={deleteWorkerMutation.isPending ? "opacity-60" : undefined}
			padding="md"
			radius="md"
			withBorder
		>
			<Group align="center" gap="md" justify="space-between" wrap="nowrap">
				<Group align="center" className="min-w-0 flex-1" gap="md" wrap="nowrap">
					<Tooltip label={worker.id}>
						<Text className="shrink-0" fw={700} size="sm">
							{shortId(worker.id)}
						</Text>
					</Tooltip>
					<WorkerBadge value={worker.status} />
					<Tooltip label={worker.currentTask?.id ?? "No active task"}>
						<Text c="dimmed" className="min-w-0" size="sm">
							<span className="mr-1 uppercase">Task:</span>
							<span className="text-slate-900">{currentTaskLabel}</span>
						</Text>
					</Tooltip>
					<Text c="dimmed" className="shrink-0" size="sm">
						<span className="mr-1 uppercase">Created:</span>
						<span className="text-slate-900">
							{formatCreatedAt(worker.createdAt)}
						</span>
					</Text>
				</Group>
				<Group align="center" className="shrink-0" gap="md" wrap="nowrap">
					<Text c="dimmed" size="sm">
						<span className="mr-1 uppercase">Completed:</span>
						<span className="font-semibold text-slate-900">
							{completedTasks}
						</span>
					</Text>
					{canDeleteWorker ? (
						<ActionIcon
							aria-label={`Delete worker ${shortId(worker.id)}`}
							color="red"
							disabled={deleteWorkerMutation.isPending}
							onClick={handleDelete}
							variant="subtle"
						>
							<TrashIcon />
						</ActionIcon>
					) : null}
				</Group>
			</Group>
		</Card>
	);
};
