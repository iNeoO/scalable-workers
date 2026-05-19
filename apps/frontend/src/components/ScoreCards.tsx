import { ScoreCard } from "./ui/ScoreCard";

export const ScoreCards = () => {
	return (
		<div className="grid w-full gap-4 mt-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
			<ScoreCard title="Queue count" value="1200" color="blue" />
			<ScoreCard title="Dead letter" value="1200" color="red" />
			<ScoreCard title="Active workers" value="1200" color="black" />
			<ScoreCard title="Task waiting" value="1200" color="orange" />
			<ScoreCard title="Task processed" value="1200" color="black" />
			<ScoreCard title="Avg task time" value="1200" color="black " />
		</div>
	);
};
