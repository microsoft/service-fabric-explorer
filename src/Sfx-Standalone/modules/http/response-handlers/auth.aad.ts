//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IHttpPipeline,
    IHttpRequest,
    IHttpResponse,
    IHttpHeader
} from "sfx.http";

import { v4 as uuidv4 } from "uuid";
import * as url from "url";
import { BrowserWindow } from "electron";

export interface IAadMetadata {
    authority: string;
    clientId: string;
    redirectUri: string;
}

function generateAuthzUrl(aadMetadata: IAadMetadata, authzEndpoint: string): string {
    const authzUrl = new url.URL(authzEndpoint);

    authzUrl.searchParams.set("client_id", aadMetadata.clientId);
    authzUrl.searchParams.set("response_type", "id_token");
    authzUrl.searchParams.set("redirect_uri", aadMetadata.redirectUri);
    authzUrl.searchParams.set("response_mode", "query");
    authzUrl.searchParams.set("nonce", uuidv4());

    return authzUrl.href;
}

function acquireAuthzToken(aadMetadata: IAadMetadata, authzEndpoint: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const authzUrl = generateAuthzUrl(aadMetadata, authzEndpoint);

        const authzWnd = new BrowserWindow({
            title: `TEST Azure Active Directory Authentication: ${url.parse(aadMetadata.redirectUri).host}`,
            width: 800,
            height: 600,
            minimizable: false,
            maximizable: false
        });

        authzWnd.setMenuBarVisibility(false);

        authzWnd.webContents.on("did-navigate", (event, targetUrl) => {
            if (targetUrl.startsWith(aadMetadata.redirectUri)) {
                authzWnd.hide();

                const token = new url.URL(targetUrl).searchParams.get("id_token");

                if (!token) {
                    reject(new Error("Invalid token recevied."));
                }

                resolve(token);
                authzWnd.destroy();
            }
        });

        authzWnd.loadURL(authzUrl);
        authzWnd.show();
    });
}

export async function handleResponseAsync(aadMetadata: IAadMetadata, pipeline: IHttpPipeline, request: IHttpRequest, response: IHttpResponse): Promise<IHttpResponse> {
    if (response.statusCode !== 401 && response.statusCode !== 403) {
        return undefined;
    }

    const openidConfigEndPoint: string =
        aadMetadata.authority.endsWith("/") ? aadMetadata.authority + ".well-known/openid-configuration" : aadMetadata.authority + "/.well-known/openid-configuration";

    const adhocResponse =
        await pipeline.requestAsync({
            method: "GET",
            url: openidConfigEndPoint
        });

    const authzEndpoint = JSON.parse(adhocResponse.body.toString("utf8"))["authorization_endpoint"];

    if (!authzEndpoint) {
        throw new Error("Azure Active Directory Authority didn't reply the correct metatdata.");
    }

    const token = await acquireAuthzToken(aadMetadata, authzEndpoint);

    if (!pipeline.requestTemplate) {
        pipeline.requestTemplate = Object.create(null);
    }

    if (!pipeline.requestTemplate.headers) {
        pipeline.requestTemplate.headers = [];
    }

    let authzHeader: IHttpHeader;

    if (authzHeader = pipeline.requestTemplate.headers.find((header) => header.name === "Authorization")) {
        authzHeader.value = `Bearer ${token}`;
    } else {
        pipeline.requestTemplate.headers.push(authzHeader = { name: "Authorization", value: `Bearer ${token}` });
    }

    return await pipeline.requestAsync(request);
}
