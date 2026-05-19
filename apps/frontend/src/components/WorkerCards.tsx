import { Title } from "@mantine/core";
import { WorkerCard } from "./ui/WorkerCard";

export const WorkerCards = () => {
	return (
		<div>
			<Title order={2}>Real time workers</Title>
			<WorkerCard />
		</div>
	);
};
