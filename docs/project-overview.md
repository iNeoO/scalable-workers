# Scalable Workers

## Purpose

Build a dashboard to manage and monitor workers that process timed tasks.

## Applications

- `db`: stores runtime data
- `queue`: manages task distribution
- `backend`: exposes monitoring and worker management APIs
- `frontend`: displays the dashboard
- `worker`: processes tasks

## Tech Stack

- `queue`: RabbitMQ
- `db`: PostgreSQL
- `stats`: Redis
- `backend`: Elysia
- `frontend`: React
- `worker`: TypeScript

## Data Model

The project stores `tasks` and `workers` in PostgreSQL and keeps live aggregate stats in Redis.

### Task

Represents a unit of work to process.

```typescript
{
  id: string;
  durationMs: number;
  status: "pending" | "running" | "finished";
  processedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}
```

### Worker

Represents a worker runtime.

```typescript
{
  id: string;
  status: "boot" | "idle" | "busy" | "shutdown";
  currentTaskId: string | null;
  createdAt: Date;
  deletedAt: Date | null;
}
```

### Relations

- A worker can process one current task through `currentTaskId`
- A task can be linked to the worker that processed it through `processedBy`
- `GET /workers` returns the current task and finished processed tasks
- `GET /tasks` returns relational data: `processedByWorker`

## Stats

The live stats payload contains:

```typescript
{
  queueCount: number;
  deadLetterQueueCount: number;
  tasksProcessed: number;
  tasksWaiting: number;
  workersCount: number;
  averageTimeByTask: number;
}
```

- `queueCount`: current RabbitMQ queue depth
- `deadLetterQueueCount`: current DLQ depth
- `tasksProcessed`: incremented when a task finishes
- `tasksWaiting`: incremented when a task is created, decremented when processing starts
- `workersCount`: incremented when a worker registers as `idle`, decremented on shutdown
- `averageTimeByTask`: computed from the total execution time stored in Redis

## Backend

### Registered Endpoints

#### `GET /tasks`

Returns all tasks with the `processedByWorker` relation.

**Response**

```typescript
Array<{
  id: string;
  durationMs: number;
  status: "pending" | "running" | "finished";
  processedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  processedByWorker: Worker | null;
}>
```

#### `POST /tasks`

Creates a task, publishes it to the queue, increments `tasksWaiting`, then emits:

- `task.created`
- `stats.updated`

**Body**

```typescript
{
  durationMs: number;
}
```

**Response**

```typescript
{
  id: string;
  durationMs: number;
  status: "pending";
  processedBy: null;
  createdAt: Date;
  updatedAt: Date;
  startedAt: null;
  finishedAt: null;
}
```

#### `DELETE /tasks/:id`

Deletes a task row and returns the deleted entity.

#### `GET /workers`

Returns all non-deleted workers with their relations.

**Response**

```typescript
Array<{
  id: string;
  status: "boot" | "idle" | "busy" | "shutdown";
  currentTaskId: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  currentTask: Task | null;
  processedTasks: Task[]; // only tasks with status "finished"
}>
```

#### `POST /workers`

Creates a worker record in `boot`, starts its container, and returns both the worker and container metadata.

**Response**

```typescript
{
  id: string;
  status: "boot";
  currentTaskId: null;
  createdAt: Date;
  deletedAt: null;
  currentTask: null;
  processedTasks: Task[];
  container: unknown;
}
```

Notes:

- the worker is created in PostgreSQL before the container starts
- if container startup fails, the worker row is hard-deleted
- the worker later becomes `idle` when the runtime registers itself

#### `DELETE /workers/:id`

Marks the worker as `shutdown`, stops the container, and returns both the updated worker and container metadata.

**Response**

```typescript
{
  id: string;
  status: "shutdown";
  currentTaskId: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  currentTask: Task | null;
  processedTasks: Task[]; // only tasks with status "finished"
  container: unknown;
}
```

#### `GET /stats`

The code currently registers two handlers on the same path:

- `GET /stats` from `stats.controller.ts`: returns a JSON snapshot
- `GET /stats` from `sse.controller.ts`: streams notifications as `text/event-stream`

JSON snapshot payload:

```typescript
{
  queueCount: number;
  deadLetterQueueCount: number;
  tasksProcessed: number;
  tasksWaiting: number;
  workersCount: number;
  averageTimeByTask: number;
}
```

### Notifications

The real-time stream is backed by Redis pub/sub and forwards three payload families:

```typescript
type SseMessage =
  | {
      event: "stats.updated";
      data: {
        stats: {
          queueCount: number;
          deadLetterQueueCount: number;
          tasksProcessed: number;
          tasksWaiting: number;
          workersCount: number;
          averageTimeByTask: number;
        };
      };
    }
  | {
      event: "task.created" | "task.started" | "task.finished";
      data: {
        task: {
          id: string;
          durationMs: number;
          status: "pending" | "running" | "finished";
          processedBy: string | null;
          createdAt: Date;
          startedAt: Date | null;
          finishedAt: Date | null;
        };
      };
    }
  | {
      event: "worker.created" | "worker.updated" | "worker.removed";
      data: {
        worker: {
          id: string;
          status: "boot" | "idle" | "busy" | "shutdown";
          currentTaskId: string | null;
          createdAt: Date;
          deletedAt: Date | null;
          currentTask: Task | null;
          processedTasks: Task[];
        };
      };
    };
```

Current emitted events in the code:

- task lifecycle: `task.created`, `task.started`, `task.finished`
- worker lifecycle: `worker.created`, `worker.updated`
- stats: `stats.updated`

Note:

- `worker.removed` exists in the shared constants, but no current producer publishes it

## Worker Lifecycle

The effective worker status transitions are:

1. `boot`: row created by `POST /workers`
2. `idle`: worker process registers successfully
3. `busy`: worker starts a task
4. `idle`: worker finishes a task and is released
5. `shutdown`: worker is stopped

## Task Lifecycle

The effective task status transitions are:

1. `pending`: task created
2. `running`: worker starts the task
3. `finished`: worker completes the task

## Frontend Expectations

- Display live stats, including queue and DLQ depth
- Display workers with status, current task, and completed-task count
- Display task history and task lifecycle updates from notifications
