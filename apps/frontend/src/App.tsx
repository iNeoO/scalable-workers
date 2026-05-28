import { Text, Title } from "@mantine/core";
import { ScoreCards } from "./components/ScoreCards";
import { TaskCards } from "./components/TaskCards";
import { WorkerCards } from "./components/WorkerCards";
import { useSSE } from "./hooks/sse.hook";

function App() {
	useSSE();

	return (
		<div className="p-4">
			<header>
				<Title order={1}>Scalable workers</Title>
				<Text c="dimmed">Infrastructure monitoring and task orchestration</Text>
			</header>
			<main>
				<ScoreCards />
				<WorkerCards />
				<TaskCards />
			</main>
			<footer></footer>
		</div>
	);
}

export default App;
