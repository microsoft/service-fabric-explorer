import { IncomingMessage, ClientRequest } from "http";
import * as https from "https";
import * as util from "util";
import * as url from "url";
import * as querystring from "querystring";
import * as fs from "fs";

import newError from "./errorUtil";
import { logInfo, logError, log } from "./log";

export enum HttpMethod {
    get = "GET",
    post = "POST",
    put = "PUT",
    patch = "PATCH",
    delete = "DELETE",
    options = "OPTIONS"
}

export enum HttpContentType {
    json = "application/json"
}

export interface IHttpClientOptions {
    method: HttpMethod;
    url: string;

    /**
     * If the request is GET/DELETE/OPTIONS, data will be converted into url query strings.
     */
    data?: any;

    /**
     * The content type in the HTTP request body if appliable. Default is "application/json".
     */
    contentType?: HttpContentType;

    /**
     * Extra headers in the request.
     */
    headers?: IDictionary<string | number>;

    /**
     * Whether to handle HTTP redirection responses. Default is true.
     */
    handleRedirections?: boolean;

    /** 
     * Whether to retry if non-successful (non-HTTP2XX) responses return. Default is false.
     */
    autoRetry?: boolean;

    /** 
     * The retry times. Default is 3 times.
     */
    retryTimes?: number;

    /** 
     * The retry interval in Seconds. Default is 15 sec.
     */
    retryInterval?: number;

    /**
     * The socket timeout in milliseconds. This will set the timeout before the socket is connected.
     */
    timeout?: number;
}

export interface ResponseHandler {
    (error: Error, response: IncomingMessage): void;
}

interface ResponseProcessor {
    (requestOptions: IHttpClientOptions,
        response: IncomingMessage,
        responseHandler: ResponseHandler): boolean;
}

function getRedirectionLocation(response: IncomingMessage): string {
    switch (response.statusCode) {
        case 301: // Moved Permanently
        case 302: // Found
        case 307: // Temporary Redirect
        case 308: // Permanent Redirect
            return response.headers["location"];

        default:
            return null;
    }
}

function getRequestBody(contentType: HttpContentType, data: any): string {
    switch (contentType) {
        case HttpContentType.json:
            return JSON.stringify(data);

        default:
            throw newError("unsupported content type: %s", contentType);
    }
}

function sendRequest(requestOptions: IHttpClientOptions, callback: ResponseHandler): void {
    try {
        logInfo("[%s] %s ...", requestOptions.method, requestOptions.url);
        let targetUrl = url.parse(requestOptions.url);
        let httpRequest =
            https.request(
                {
                    protocol: targetUrl.protocol,
                    hostname: targetUrl.hostname,
                    port: targetUrl.port,
                    path: targetUrl.path,
                    auth: targetUrl.auth,

                    headers: requestOptions.headers,
                    method: requestOptions.method,
                    timeout: requestOptions.timeout
                },
                (response) => callback(null, response))
                .on("error", (error) => callback(error, null));

        if (requestOptions.data) {
            httpRequest.write(requestOptions.data);
        }

        httpRequest.end();
    } catch (error) {
        callback(error, null);
    }
}

function applyHeadersOptions(finalRequestOptions: IHttpClientOptions): void {
    let originalHeaders = finalRequestOptions.headers;

    finalRequestOptions.headers = {};
    finalRequestOptions.headers = Object.assign(finalRequestOptions.headers, originalHeaders);
}

function applyRedirectionHandlingOptions(finalRequestOptions: IHttpClientOptions): void {
    if (util.isNullOrUndefined(finalRequestOptions.handleRedirections)
        || finalRequestOptions.handleRedirections === true) {
        finalRequestOptions.handleRedirections = true;
    }
}

function applyAutoRetryOptions(finalRequestOptions: IHttpClientOptions): void {
    if (util.isNullOrUndefined(finalRequestOptions.autoRetry)
        || finalRequestOptions.autoRetry !== true) {
        finalRequestOptions.autoRetry = false;
    } else {
        finalRequestOptions.autoRetry = true;

        if (util.isNullOrUndefined(finalRequestOptions.retryInterval)) {
            finalRequestOptions.retryInterval = 15;
        }

        if (util.isNullOrUndefined(finalRequestOptions.retryTimes)) {
            finalRequestOptions.retryTimes = 3;
        }
    }
}

function applyRequestBodyOptions(finalRequestOptions: IHttpClientOptions): void {
    if (!util.isUndefined(finalRequestOptions.data)) {
        if (util.isNullOrUndefined(finalRequestOptions.contentType)) {
            finalRequestOptions.contentType = HttpContentType.json;
        }

        switch (finalRequestOptions.method) {
            case HttpMethod.post:
            case HttpMethod.put:
            case HttpMethod.patch:
                finalRequestOptions.data = getRequestBody(finalRequestOptions.contentType, finalRequestOptions.data);

                if (finalRequestOptions.data) {
                    finalRequestOptions.headers["Content-Type"] = finalRequestOptions.contentType;
                    finalRequestOptions.headers["Content-Length"] = Buffer.byteLength(finalRequestOptions.data);
                } else {
                    finalRequestOptions.data = undefined;
                }
                break;

            case HttpMethod.get:
            case HttpMethod.delete:
            case HttpMethod.options:
            default:
                if (finalRequestOptions.data) {
                    let targetUrl = url.parse(finalRequestOptions.url);
                    let params = querystring.stringify(finalRequestOptions.data);

                    if (targetUrl.search) {
                        targetUrl.search += "&" + params;
                    } else {
                        targetUrl.search = params;
                    }

                    finalRequestOptions.url = targetUrl.href;
                } else {
                    finalRequestOptions.data = undefined;
                }
                break;
        }
    }
}

function handleRedirections(
    requestOptions: IHttpClientOptions,
    response: IncomingMessage,
    responseHandler: ResponseHandler): boolean {

    if (requestOptions.handleRedirections) {
        let redirectionLocation = getRedirectionLocation(response);

        if (redirectionLocation) {
            requestOptions.url = redirectionLocation;
            logInfo("[Redirection] HTTP%d => %s", response.statusCode, redirectionLocation);
            sendRequest(requestOptions, responseHandler);
            return true;
        }
    }

    return false;
}

function handleAutoRetry(
    requestOptions: IHttpClientOptions,
    response: IncomingMessage,
    responseHandler: ResponseHandler): boolean {

    if (requestOptions.autoRetry) {
        if (response.statusCode >= 400 && requestOptions.retryTimes >= 0) {
            requestOptions.retryTimes--;
            setTimeout(
                () => {
                    logInfo("[RETRY] %s", requestOptions.url);
                    sendRequest(requestOptions, responseHandler);
                },
                requestOptions.retryInterval * 1000);
            return;
        }
    }
}

const responseProcessors: Array<ResponseProcessor> = [handleRedirections, handleAutoRetry];

export function request(requestOptions: IHttpClientOptions, callback: ResponseHandler): void {
    if (!util.isObject(requestOptions)) {
        throw newError("requestOptions must be supplied.");
    }

    if (!util.isFunction(callback)) {
        throw newError("callback must be supplied.");
    }

    let finalRequestOptions: IHttpClientOptions = {
        url: requestOptions.url,
        method: requestOptions.method
    };

    finalRequestOptions = Object.assign(finalRequestOptions, requestOptions);

    applyHeadersOptions(finalRequestOptions);
    applyRedirectionHandlingOptions(finalRequestOptions);
    applyAutoRetryOptions(finalRequestOptions);
    applyRequestBodyOptions(finalRequestOptions);

    const handleResponse: ResponseHandler =
        (error, response) => {
            if (error) {
                logInfo("[ERROR] %s, error: %s", finalRequestOptions.url, error);
            } else {
                logInfo("[HTTP%d] %s", response.statusCode, finalRequestOptions.url);
                for (let processor of responseProcessors) {
                    try {
                        if (processor(finalRequestOptions, response, handleResponse)) {
                            return;
                        }
                    } catch (error) {
                        callback(error, response);
                        return;
                    }
                }
            }

            callback(error, response);
        };

    sendRequest(finalRequestOptions, handleResponse);
}

export function get(url: string, callback: ResponseHandler): void {
    request(
        {
            url: url,
            method: HttpMethod.get
        },
        callback);
}

export function post(url: string, data: any, callback: ResponseHandler): void {
    request(
        {
            url: url,
            method: HttpMethod.post,
            data: data
        },
        callback);
}

export function put(url: string, data: any, callback: ResponseHandler): void {
    request(
        {
            url: url,
            method: HttpMethod.put,
            data: data
        },
        callback);
}

export function patch(url: string, data: any, callback: ResponseHandler): void {
    request(
        {
            url: url,
            method: HttpMethod.patch,
            data: data
        },
        callback);
}

export function del(url: string, callback: ResponseHandler): void {
    request(
        {
            url: url,
            method: HttpMethod.delete
        },
        callback);
}

export function createJsonResponseHandler<TJson>(callback: (error: Error, json: TJson) => void): ResponseHandler {
    if (!util.isFunction(callback)) {
        throw newError("callback function must be supplied.");
    }

    return (error, response) => {
        if (error) {
            callback(error, null);
        } else if (response.statusCode >= 200 && response.statusCode < 300) {
            let json: string = "";

            response.on("data", (chunk) => json += chunk);
            response.on("end", () => {
                try {
                    let jsonObject = <TJson>JSON.parse(json);
                    callback(null, jsonObject);
                } catch (error) {
                    callback(error, null);
                }
            });
        } else {
            callback(newError("Unexpected response: \nHTTP %s %s\n%s", response.statusCode, response.statusMessage, response.rawHeaders.join("\n")), null);
        }
    };
}

export function createFileResponseHandler(fd: number, autoClose: boolean, callback: (error: Error) => void): ResponseHandler {
    return (error, response) => {
        if (error) {
            callback(error);
        } else if (response.statusCode >= 200 && response.statusCode < 300) {
            let fileStream = fs.createWriteStream(null, { fd: fd, autoClose: autoClose });

            response
                .pipe(fileStream)
                .on("finish", () => fileStream.end());
            callback(null);
        } else {
            callback(newError("Unexpected response: \nHTTP %s %s\n%s", response.statusCode, response.statusMessage, response.rawHeaders.join("\n")));
        }
    };
}
