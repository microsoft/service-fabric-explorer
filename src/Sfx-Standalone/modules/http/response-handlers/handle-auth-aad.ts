//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IHttpClient,
    ResponseAsyncHandler,
    IRequestOptions,
    IHttpResponse
} from "sfx.http";

import { ILog } from "sfx.logging";
import { IAadMetadata } from "sfx.http.auth";

import { WebContents } from "electron";
import * as url from "url";
import * as uuidv4 from "uuid/v4";

interface IAadOAuthConfig {
    authorization_endpoint: string;
    token_endpoint: string;
    response_types_supported: Array<string>;
}

class AadTokenAcquirer {
    private readonly httpClient: IHttpClient;

    private readonly handlingHost: WebContents;

    private readonly aadMetadata: IAadMetadata;

    private resolve: (token: string) => void;

    private reject: (reason?: any) => void;

    constructor(httpClient: IHttpClient, handlingHost: WebContents, aadMetadata: IAadMetadata) {
        this.httpClient = httpClient;
        this.handlingHost = handlingHost;
        this.aadMetadata = aadMetadata;
    }

    public acquireTokenAsync(): Promise<string> {
        return this.acquireAadOAuthConfig()
            .then((aadOAuthConfig) => {
                if (!aadOAuthConfig.response_types_supported.includes("id_token")) {
                    return Promise.reject(Error(`"id_token" is not supported by the remote authority.`));
                }

                const authorizeUrl = new URL(aadOAuthConfig.authorization_endpoint);

                authorizeUrl.searchParams.append("client_id", this.aadMetadata.clientId);
                authorizeUrl.searchParams.append("response_type", "id_token");
                authorizeUrl.searchParams.append("redirect_uri", this.aadMetadata.redirect);
                authorizeUrl.searchParams.append("response_mode", "query");
                authorizeUrl.searchParams.append("nonce", uuidv4());

                this.handlingHost.on("did-get-redirect-request", this.onRedirecting);

                this.handlingHost.loadURL(authorizeUrl.href);

                return new Promise<string>((resolve, reject) => {
                    this.resolve = resolve;
                    this.reject = reject;
                });
            });
    }

    private extractToken(urlString: string): string {
        const urlWithToken = url.parse(urlString);
        const tokenStart = urlWithToken.hash.indexOf("=");

        if (tokenStart >= 0) {
            return urlWithToken.hash.substr(tokenStart + 1);
        }

        return undefined;
    }

    private acquireAadOAuthConfig(): Promise<IAadOAuthConfig> {
        const oauthConfigHref = new URL(".well-known/openid-configuration", this.aadMetadata.authority).href;

        return this.httpClient.getAsync(oauthConfigHref)
            .then((response) => {
                if (!response.data) {
                    return Promise.reject(new Error(`Failed to retrieve Aad OAuth config: ${oauthConfigHref}`));
                }

                return Promise.resolve(response.data);
            });
    }

    private onRedirecting =
        (event, oldUrlString: string, newUrlString: string): void => {
            if (newUrlString.toUpperCase().startsWith(this.aadMetadata.redirect.toUpperCase())) {
                const token = this.extractToken(newUrlString);

                this.handlingHost.removeListener("did-get-redirect-request", this.onRedirecting);
                token ? this.resolve(token) : this.reject(new Error("Toke is missing in the reply url."));
            }
        }
}

export default async function handleAadAsync(
    handlingHost: WebContents,
    aadMetadata: IAadMetadata,
    nextHandler: ResponseAsyncHandler)
    : Promise<ResponseAsyncHandler> {

    return async (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: IHttpResponse): Promise<any> => {
        const statusCode = await response.statusCode;

        if (statusCode === 403 || statusCode === 401) {
            const acquirer = new AadTokenAcquirer(client, handlingHost, aadMetadata);

            return acquirer.acquireTokenAsync()
                .then(
                    async (token) => {
                        const options = await client.defaultRequestOptions;

                        options.headers["Authorization"] = `Bearer ${token}`;
                        await client.updateDefaultRequestOptionsAsync(options);

                        return client.requestAsync(requestOptions, requestData);
                    },
                    (reason) => {
                        log.writeErrorAsync("AAD Auth handler failed: {}", reason);
                        return Promise.reject(reason);
                    });
        }

        if (Function.isFunction(nextHandler)) {
            return nextHandler(client, log, requestOptions, requestData, response);
        }

        return Promise.resolve(response);
    };
}
