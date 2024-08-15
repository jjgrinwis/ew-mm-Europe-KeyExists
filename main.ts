import URLSearchParams from "url-search-params";
import { createResponse } from "create-response";
import { logger } from "log";
import { executeRestQL } from "./service.js";
import { QUERY_WORKER_NAME } from "./config.js";
import { httpRequest } from "http-request";

let status = 500;

// typescript enforces us to "interface" this var, just do it.
interface QueryWorkerErrorResult {
  errorMessage?: string;
  errorNum?: any;
  errorCode?: number;
  error?: boolean;
}

export async function responseProvider(request: EW.ResponseProviderRequest) {
  const params = new URLSearchParams(request.query);

  /* For the demo moving authorization key into 'hidden' PM_user var.
  authorization should look like "apikey {some key}" 
  */
  const authorizationHeader = `apikey ${request.getVariable(
    "PMUSER_MM_APIKEY"
  )}`;

  let result: QueryWorkerErrorResult = {};
  let keyFound: Boolean = false;

  // check if bindVars is provided.
  const bindVars = params.get("bindVars");

  // if for bindVars is not provided, create error result
  // during testing we found out that providing no value will result in a true with our current Query Worker
  // need to fix that, someday.
  if (!bindVars || bindVars === "null") {
    result.errorCode = 400;
    result.errorMessage = "no bindVar query string provided";
    result.error = true;
    status = 200;
  } else {
    try {
      const document = await executeRestQL(
        QUERY_WORKER_NAME,
        authorizationHeader,
        JSON.parse(bindVars)
      );

      // if executeRestQL succeeds, just set status to 200 and assign response to the result
      logger.info(`Macrometa Query Worker call succeeded}`);
      status = 200;
      result = document;
      // let's lookup if key exists. If anything wrong, just set it to false
      // doing this in the try/catch block and result should look like this:
      // [true] Macrometa Query Worker will always return a list.
      //keyFound = result[0]["result"] || false;
      keyFound = result[0] || false;
    } catch (error) {
      // something went wrong
      logger.error(
        "Error occurred while executing edgeWorker",
        error.toString()
      );
      status = error.status || 500;
      result.error = true;

      if (error.status) {
        const dbError = JSON.parse(error.message) || {};
        result.errorCode = dbError.code;
        result.errorMessage = dbError.errorMessage || "Something went wrong";
        result.errorNum = dbError.errorNum;
      } else {
        result.errorMessage = error.toString() || "Something went wrong";
      }
    }
  }

  // we moved the assignment of this keyFound var into catch/try block.
  // we tested with an await on result which worked fine but moved it to the try/catch block to set the var.
  // lets make a record in the KV if key exists
  if (keyFound === true) {
    // just do an httpRequest, no need to wait for the answer and not sending any bindVar query sting with it.
    // If we need to send some bindVar in they future use  URLSearchParams class to create one.
    logger.info("Storing a No More Leaks hit");
    httpRequest("https://api.grinwis.com/StoreHit");
  }

  return Promise.resolve(
    createResponse(
      status,
      {
        "Content-Type": "application/json",
        "Content-Language": "en-US",
      },
      JSON.stringify(result)
    )
  );
}
