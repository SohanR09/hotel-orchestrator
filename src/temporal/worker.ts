import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';
import { logger } from '../middleware/logger';
import path from 'path';

async function run() {
  const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';

  logger.info(`[Worker] Connecting to Temporal at ${temporalAddress}`);

  const connection = await NativeConnection.connect({
    address: temporalAddress,
  });

  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: 'hotel-task-queue',
    workflowsPath: path.join(__dirname, 'workflow'),
    activities,
  });

  logger.info('[Worker] Hotel Temporal Worker started, listening on task queue: hotel-task-queue');

  await worker.run();
}

run().catch((err) => {
  logger.error(`[Worker] Fatal error: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
