import { Client, Connection } from '@temporalio/client';
import { logger } from '../middleware/logger';

let client: Client | null = null;

export async function getTemporalClient(): Promise<Client> {
  if (client) return client;

  const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  logger.info(`[Temporal Client] Connecting to ${temporalAddress}`);

  const connection = await Connection.connect({ address: temporalAddress });
  client = new Client({ connection, namespace: 'default' });

  logger.info('[Temporal Client] Connected successfully');
  return client;
}
