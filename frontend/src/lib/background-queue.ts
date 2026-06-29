type Task<T> = (signal: AbortSignal) => Promise<T>;

interface QueueItem<T> {
  id: string;
  task: Task<T>;
  priority: number;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  abortController: AbortController;
}

export class BackgroundQueue {
  private queue: QueueItem<unknown>[] = [];
  private running = 0;
  private maxConcurrent: number;
  private pending = new Map<string, Promise<unknown>>();

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  enqueue<T>(id: string, task: (signal: AbortSignal) => Promise<T>, priority = 0): { promise: Promise<T>; abort: () => void } {
    const existing = this.pending.get(id);
    if (existing) {
      return {
        promise: existing as Promise<T>,
        abort: () => {},
      };
    }

    const abortController = new AbortController();

    const promise = new Promise<T>((resolve, reject) => {
      const item: QueueItem<T> = {
        id,
        task: async (_signal: AbortSignal) => {
          if (abortController.signal.aborted) {
            throw new DOMException("Aborted", "AbortError");
          }
          return task(abortController.signal);
        },
        priority,
        resolve,
        reject,
        abortController,
      };

      this.queue.push(item as QueueItem<unknown>);
      this.pending.set(id, promise);
      this.processQueue();
    });

    return {
      promise: promise.finally(() => {
        this.pending.delete(id);
      }),
      abort: () => {
        abortController.abort();
        this.queue = this.queue.filter((q) => q.id !== id);
        this.pending.delete(id);
      },
    };
  }

  private processQueue(): void {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) return;

    this.queue.sort((a, b) => b.priority - a.priority);

    const item = this.queue.shift()!;
    this.running++;

    item
      .task(item.abortController.signal)
      .then((result) => {
        item.resolve(result);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        item.reject(err);
      })
      .finally(() => {
        this.running--;
        this.processQueue();
      });
  }

  cancelAll(): void {
    for (const item of this.queue) {
      item.abortController.abort();
    }
    this.queue = [];
    this.pending.clear();
    this.running = 0;
  }

  get pendingCount(): number {
    return this.queue.length + this.running;
  }
}

export const globalQueue = new BackgroundQueue(3);
