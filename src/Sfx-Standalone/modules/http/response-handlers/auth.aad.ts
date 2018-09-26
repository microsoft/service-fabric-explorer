//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IHttpPipeline,
    IHttpRequest,
    IHttpResponse
} from "sfx.http";

import * as uuidv4 from "uuid/v4";
import * as url from "url";
import { BrowserWindow } from "electron";

export interface IAadMetadata {
    authority: string;
    clientId: string;
    redirectUri: string;
}

function acquireAuthzToken(aadMetadata: IAadMetadata, authzEndpoint: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const authzUrl = new URL(authzEndpoint);

        authzUrl.searchParams.append("client_id", aadMetadata.clientId);
        authzUrl.searchParams.append("response_type", "id_token");
        authzUrl.searchParams.append("redirect_uri", aadMetadata.redirectUri);
        authzUrl.searchParams.append("response_mode", "query");
        authzUrl.searchParams.append("nonce", uuidv4());

        const authzWnd = new BrowserWindow({
            title: `Azure Active Directory Authentication: ${url.parse(aadMetadata.redirectUri).host}`,
            width: 800,
            height: 600,
            minimizable: false,
            maximizable: false
        });

        authzWnd.setMenuBarVisibility(false);

        authzWnd.webContents.on("did-navigate", (event, url) => {
            if (url.startsWith(aadMetadata.redirectUri)) {
                authzWnd.hide();

                const token = new URL(url).searchParams.get("id_token");

                if (!token) {
                    reject(new Error("Invalid token recevied."));
                }

                resolve(token);
                authzWnd.destroy();
            }
        });

        authzWnd.loadURL(authzUrl.href);
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

    pipeline.requestTemplate.headers.push({ name: "Authorization", value: `Bearer ${token}` });

    return await pipeline.requestAsync(request);
}
