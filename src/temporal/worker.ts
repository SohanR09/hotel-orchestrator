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

  // __dirname at runtime = dist/temporal/
  // project root         = dist/temporal/../../  = project root
  // workflow source      = project root + src/temporal/workflow.ts
  const workflowsPath = path.resolve(__dirname, '..', '..', 'src', 'temporal', 'workflow.ts');
  logger.info(`[Worker] Workflows path: ${workflowsPath}`);

  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: 'hotel-task-queue',
    workflowsPath,
    activities,
  });

  logger.info('[Worker] Started — listening on task queue: hotel-task-queue');
  await worker.run();
}

run().catch((err) => {
  logger.error(`[Worker] Fatal error: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
