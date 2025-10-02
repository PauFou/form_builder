/**
 * Base worker class
 */

import { Worker, Job, WorkerOptions } from "bullmq";
import { Redis } from "ioredis";
import { logger } from "../logger";
import { config } from "../config";

export abstract class BaseWorker<T = any> {
  protected worker: Worker<T> | null = null;

  constructor(
    public readonly name: string,
    protected readonly connection: Redis
  ) {}

  abstract process(job: Job<T>): Promise<any>;

  async start(): Promise<void> {
    const workerOptions: WorkerOptions = {
      connection: this.connection,
      concurrency: config.workers.concurrency,
      maxStalledCount: config.workers.maxStalledCount,
      stalledInterval: config.workers.stalledInterval,
      removeOnComplete: config.workers.removeOnComplete,
      removeOnFail: config.workers.removeOnFail,
    };

    this.worker = new Worker<T>(
      this.name,
      async (job) => {
        const startTime = Date.now();
        const log = logger.child({
          worker: this.name,
          jobId: job.id,
          jobName: job.name,
        });

        try {
          log.debug({ data: job.data }, "Processing job");
          const result = await this.process(job);

          const duration = Date.now() - startTime;
          log.info({ duration, result }, "Job completed");

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          log.error({ error, duration }, "Job failed");
          throw error;
        }
      },
      workerOptions
    );

    // Worker event handlers
    this.worker.on("completed", (job) => {
      logger.debug(
        {
          worker: this.name,
          jobId: job.id,
        },
        "Job completed event"
      );
    });

    this.worker.on("failed", (job, error) => {
      logger.error(
        {
          worker: this.name,
          jobId: job?.id,
          error: error.message,
        },
        "Job failed event"
      );
    });

    this.worker.on("error", (error) => {
      logger.error(
        {
          worker: this.name,
          error,
        },
        "Worker error"
      );
    });
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }
}
