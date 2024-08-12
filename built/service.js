import { client } from './client.js';
import { logger } from 'log';

export const fetchNextBatch = async (
  cursorId,
  authorizationToken,
  previousResult = [],
) => {
  let response;
  try {
    response = await client.getNextBatch(cursorId, authorizationToken);

    if (!response.ok) throw new Error(await response.text());

    const { result, hasMore, id } = await response.json();

    previousResult = previousResult.concat(result);

    if (!hasMore) {
      return previousResult;
    }

    return await fetchNextBatch(id, authorizationToken, previousResult);
  } catch (error) {
    if (!error.status) error.status = response.status;
    logger.log(`Failed to fetch ${cursorId}`, JSON.stringify(error));
    throw error;
  }
};

export const executeRestQL = async (name, authorizationToken, params = {}) => {
  let restQLResponse = [];
  let response;
  try {
    response = await client.executeQueryWorker(
      name,
      params,
      authorizationToken,
    );

    if (!response.ok) throw new Error(await response.text());

    const { result, id, hasMore } = await response.json();

    if (!hasMore) {
      return result;
    }

    restQLResponse = await fetchNextBatch(id, authorizationToken, result);
    return restQLResponse;
  } catch (error) {
    if (!error.status) error.status = response.status;
    logger.log(`Failed to fetch ${name}`, JSON.stringify(error));
    throw error;
  }
};
