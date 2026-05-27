import { Button, Group, Stack, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useCreateWorker, useWorkers } from "../hooks/workers.hook";
import { WorkerCard } from "./ui/WorkerCard";

export const WorkerCards = () => {
	const workersQuery = useWorkers();
	const createWorkerMutation = useCreateWorker();
	const workers = workersQuery.data ?? [];

	const handleCreateWorker = async () => {
		try {
			await createWorkerMutation.mutateAsync();
			notifications.show({
				color: "green",
				message: "Worker created",
				title: "Worker added",
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to create worker";
			notifications.show({
				color: "red",
				message,
				title: "Create failed",
			});
		}
	};

	return (
		<section className="mt-8">
			<Group align="end" className="mb-4" justify="space-between">
				<Title order={2}>Real time workers</Title>
				<Group justify="flex-end">
					<Button
						loading={createWorkerMutation.isPending}
						onClick={handleCreateWorker}
					>
						Add worker
					</Button>
				</Group>
			</Group>
			<Stack gap="sm">
				{workers.map((worker) => (
					<WorkerCard key={worker.id} worker={worker} />
				))}
			</Stack>
		</section>
	);
};
