import URLSearchParams from "url-search-params";
import { createResponse } from "create-response";
import { logger } from "log";
import { executeRestQL } from "./service.js";
import { QUERY_WORKER_NAME } from "./config.js";
let status = 500;
export async function responseProvider(request) {
    const params = new URLSearchParams(request.query);
    /* For the demo moving authorization key into 'hidden' PM_user var.
    authorization should look like "apikey {some key}"
    */
    const authorizationHeader = `apikey ${request.getVariable("PMUSER_MM_APIKEY")}`;
    let result = {};
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
    }
    else {
        try {
            const document = await executeRestQL(QUERY_WORKER_NAME, authorizationHeader, JSON.parse(bindVars));
            // if executeRestQL succeeds, just set status to 200 and assign response to the result
            logger.info("Macrometa Query Worker call succeeded");
            status = 200;
            result = document;
        }
        catch (error) {
            // something went wrong
            logger.error("Error occurred while executing edgeWorker", error.toString());
            status = error.status || 500;
            result.error = true;
            if (error.status) {
                const dbError = JSON.parse(error.message) || {};
                result.errorCode = dbError.code;
                result.errorMessage = dbError.errorMessage || "Something went wrong";
                result.errorNum = dbError.errorNum;
            }
            else {
                result.errorMessage = error.toString() || "Something went wrong";
            }
        }
    }
    return Promise.resolve(createResponse(status, {
        "Content-Type": "application/json",
        "Content-Language": "en-US",
    }, JSON.stringify(result)));
}
