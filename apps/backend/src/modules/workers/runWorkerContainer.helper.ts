import { resolve } from "node:path";
import { workerEnv as workerConfigEnv } from "./config/env.js";

const WORKER_DOCKERFILE_PATH = "apps/task-worker/Dockerfile";
const WORKER_CONTAINER_LABEL = "scalable-workers.role=task-worker";
const WORKER_CONTAINER_NAME_PATTERN =
	/^scalable-worker-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Docker build context must be the monorepo root so workspace files are available.
const REPOSITORY_ROOT = resolve(import.meta.dir, "../../../../../");

const getDockerEnvArgs = (env: Record<string, string>) =>
	Object.entries(env).flatMap(([key, value]) => ["--env", `${key}=${value}`]);

export const createWorkerContainerEnv = (workerId: string) => {
	const env: Record<string, string> = {
		WORKER_ID: workerId,
		AMQP_QUEUE: workerConfigEnv.amqpQueue,
		AMQP_URL: workerConfigEnv.amqpUrl,
		PG_URL: workerConfigEnv.pgUrl,
		REDIS_SW_HOST: workerConfigEnv.redisHost,
		REDIS_SW_PORT: workerConfigEnv.redisPort,
	};

	if (workerConfigEnv.redisPassword !== undefined) {
		env.REDIS_SW_PASSWORD = workerConfigEnv.redisPassword;
	}

	if (workerConfigEnv.redisUsername !== undefined) {
		env.REDIS_SW_USERNAME = workerConfigEnv.redisUsername;
	}

	return env;
};

export const getWorkerContainerName = (workerId: string) =>
	`scalable-worker-${workerId}`;

const readStream = async (stream: ReadableStream<Uint8Array> | null) => {
	if (!stream) return "";

	return await new Response(stream).text();
};

const runDockerCommand = async (cmd: string[]) => {
	const proc = Bun.spawn({
		cmd,
		cwd: REPOSITORY_ROOT,
		stdin: "ignore",
		stdout: "pipe",
		stderr: "pipe",
	});

	const [exitCode, stdout, stderr] = await Promise.all([
		proc.exited,
		readStream(proc.stdout),
		readStream(proc.stderr),
	]);

	return {
		exitCode,
		stdout: stdout.trim(),
		stderr: stderr.trim(),
	};
};

const ensureWorkerImage = async (image: string) => {
	const inspectResult = await runDockerCommand([
		"docker",
		"image",
		"inspect",
		image,
	]);
	if (inspectResult.exitCode === 0) return;

	const buildResult = await runDockerCommand([
		"docker",
		"build",
		"-t",
		image,
		"-f",
		WORKER_DOCKERFILE_PATH,
		".",
	]);

	if (buildResult.exitCode !== 0) {
		throw new Error(
			buildResult.stderr ||
				buildResult.stdout ||
				"failed to build worker image",
		);
	}
};

const ensureDockerNetwork = async (network: string) => {
	const inspectResult = await runDockerCommand([
		"docker",
		"network",
		"inspect",
		network,
	]);

	if (inspectResult.exitCode === 0) return;

	throw new Error(
		`Docker network "${network}" not found. Run "docker compose up -d" first or set WORKER_DOCKER_NETWORK.`,
	);
};

const removeWorkerContainerIfExists = async (containerName: string) => {
	await runDockerCommand(["docker", "rm", "-f", containerName]);
};

const getRunningWorkerContainerRefs = async () => {
	const [labeledContainersResult, legacyContainersResult] = await Promise.all([
		runDockerCommand([
			"docker",
			"ps",
			"-q",
			"--filter",
			`label=${WORKER_CONTAINER_LABEL}`,
		]),
		runDockerCommand([
			"docker",
			"ps",
			"--format",
			"{{.Names}}",
			"--filter",
			"name=scalable-worker-",
		]),
	]);

	const labeledContainerIds =
		labeledContainersResult.exitCode === 0
			? labeledContainersResult.stdout.split("\n").filter(Boolean)
			: [];

	const legacyContainerNames =
		legacyContainersResult.exitCode === 0
			? legacyContainersResult.stdout
					.split("\n")
					.filter((name) => WORKER_CONTAINER_NAME_PATTERN.test(name))
			: [];

	return [...new Set([...labeledContainerIds, ...legacyContainerNames])];
};

const getWorkerContainerLogs = async (containerName: string) => {
	const result = await runDockerCommand(["docker", "logs", containerName]);
	return result.stderr || result.stdout;
};

const assertWorkerContainerStarted = async (containerName: string) => {
	await Bun.sleep(750);

	const inspectResult = await runDockerCommand([
		"docker",
		"inspect",
		"--format",
		"{{.State.Running}}",
		containerName,
	]);

	if (inspectResult.exitCode === 0 && inspectResult.stdout === "true") return;

	const logs = await getWorkerContainerLogs(containerName);
	throw new Error(
		logs ||
			inspectResult.stderr ||
			inspectResult.stdout ||
			"worker container stopped immediately after startup",
	);
};

export const runWorkerContainer = async (workerId: string) => {
	const containerName = getWorkerContainerName(workerId);

	const dockerEnv = createWorkerContainerEnv(workerId);
	await ensureWorkerImage(workerConfigEnv.dockerImage);
	await ensureDockerNetwork(workerConfigEnv.dockerNetwork);
	await removeWorkerContainerIfExists(containerName);

	const { exitCode, stdout, stderr } = await runDockerCommand([
		"docker",
		"run",
		"-d",
		"--name",
		containerName,
		"--label",
		WORKER_CONTAINER_LABEL,
		"--network",
		workerConfigEnv.dockerNetwork,
		...getDockerEnvArgs(dockerEnv),
		workerConfigEnv.dockerImage,
	]);

	if (exitCode !== 0) {
		throw new Error(
			stderr.trim() || stdout.trim() || "failed to start worker container",
		);
	}

	await assertWorkerContainerStarted(containerName);

	return {
		containerId: stdout.trim(),
		containerName,
		image: workerConfigEnv.dockerImage,
	};
};

export const stopWorkerContainer = async (workerId: string) => {
	const containerName = getWorkerContainerName(workerId);
	const { exitCode, stdout, stderr } = await runDockerCommand([
		"docker",
		"rm",
		"-f",
		containerName,
	]);

	if (exitCode !== 0) {
		throw new Error(
			stderr.trim() ||
				stdout.trim() ||
				"failed to stop and remove worker container",
		);
	}

	return {
		containerName,
	};
};

export const removeRunningWorkerContainers = async () => {
	const containerRefs = await getRunningWorkerContainerRefs();
	if (containerRefs.length === 0) {
		return {
			removedContainers: [],
		};
	}

	const { exitCode, stdout, stderr } = await runDockerCommand([
		"docker",
		"rm",
		"-f",
		...containerRefs,
	]);

	if (exitCode !== 0) {
		throw new Error(
			stderr.trim() ||
				stdout.trim() ||
				"failed to stop and remove running worker containers",
		);
	}

	return {
		removedContainers: containerRefs,
	};
};
