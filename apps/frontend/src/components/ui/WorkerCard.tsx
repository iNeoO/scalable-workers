import { Card } from "@mantine/core";
import type { WorkerStatus } from "@sw/common/types";

type WokerCardProps = {
	name: string;
	status: WorkerStatus;
	currentTaskId: string | null;
	created: Date;
	nbTaskFinished: number;
};

export const WorkerCard = ({}: WokerCardProps) => {
	return <Card></Card>;
};
