import { httpRequest } from 'http-request';
import {
  C8_URL,
  FABRIC,
  MACROMETA_ORIGIN_NAME,
  QUERY_WORKER_NAME,
} from './config.js';

export const client = {
  executeQueryWorker: (queryWorkerName, bindVars, authorizationToken) => {
    return httpRequest(
      `${C8_URL}/_fabric/${FABRIC}/_api/restql/execute/${QUERY_WORKER_NAME}`,
      {
        method: 'POST',
        headers: {
          authorization: authorizationToken,
          'Macrometa-Origin': MACROMETA_ORIGIN_NAME,
        },
        body: JSON.stringify({
          queryWorkerName,
          bindVars,
          batchSize: 500,
        }),
      },
    );
  },
  getNextBatch: (cursorId, authorizationToken) => {
    return httpRequest(
      `${C8_URL}/_fabric/${FABRIC}/_api/restql/fetch/${cursorId}`,
      {
        method: 'PUT',
        headers: {
          authorization: authorizationToken,
          'Macrometa-Origin': MACROMETA_ORIGIN_NAME,
        },
        body: JSON.stringify({}),
      },
    );
  },
};
