//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
import { IModuleInfo, IModule, IComponentInfo, Component, ObjectComponent } from "sfx.module-manager";
import { ILog } from "sfx.logging";
import { ICertificateLoader, IPkiCertificateService } from "sfx.cert";
import { IHttpClient, IHttpClientBuilder, ServerCertValidator, RequestAsyncProcessor } from "sfx.http";
import { SelectClientCertAsyncHandler, IAadMetadata } from "sfx.http.auth";
import { WebContents } from "electron";

import * as appUtils from "../../utilities/appUtils";

import { HttpProtocols } from "./common";
import handleJsonRequestAsync from "./request-handlers/handle-json";
import handleJsonResponseAsync from "./response-handlers/handle-json";
import handleRedirectionResponseAsync from "./response-handlers/handle-redirection";
import handleAuthAadResponseAsync from "./response-handlers/handle-auth-aad";
import handleAuthCertResponseAsync from "./response-handlers/handle-auth-cert";
import NodeHttpClientBuilder from "./node.http-client-builder";
import ElectronHttpClientBuilder from "./electron.http-client-builder";
import { IAsyncHandlerConstructor } from "sfx.common";
import { ObjectRemotingProxy } from "../proxy.object/proxy.object";

function buildNodeHttpClientAsync(
    log: ILog,
    certLoader: ICertificateLoader,
    protocol: string,
    serverCertValidator?: ServerCertValidator)
    : Promise<IHttpClient> {
    return Promise.resolve(new NodeHttpClientBuilder(log, certLoader, serverCertValidator))
        // Request handlers
        .then(builder => builder.handleRequestAsync(handleJsonRequestAsync))

        // Response handlers
        .then(builder => builder.handleResponseAsync(handleRedirectionResponseAsync))
        .then(builder => builder.handleResponseAsync(handleJsonResponseAsync))
        .then(builder => builder.buildAsync(protocol));
}

function buildElectronHttpClientAsync(
    log: ILog,
    protocol: string,
    serverCertValidator?: ServerCertValidator)
    : Promise<IHttpClient> {
    return Promise.resolve(new ElectronHttpClientBuilder(log, serverCertValidator))
        // Request handlers
        .then(builder => builder.handleRequestAsync(handleJsonRequestAsync))

        // Response handlers
        .then(builder => builder.handleResponseAsync(handleRedirectionResponseAsync))
        .then(builder => builder.handleResponseAsync(handleJsonResponseAsync))
        .then(builder => builder.buildAsync(protocol));
}

exports = <IModule>{
    getModuleMetadata: (components): IModuleInfo => {
        components
            .register<IHttpClient>({
                name: "http.http-client",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog, certLoader: ICertificateLoader, serverCertValidator?: ServerCertValidator): Promise<IHttpClient> =>
                    buildNodeHttpClientAsync(log, certLoader, HttpProtocols.any, serverCertValidator),
                deps: ["logging", "cert.cert-loader"]
            })
            .register<IHttpClient>({
                name: "http.https-client",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog, certLoader: ICertificateLoader, serverCertValidator?: ServerCertValidator): Promise<IHttpClient> =>
                    buildNodeHttpClientAsync(log, certLoader, HttpProtocols.https, serverCertValidator),
                deps: ["logging", "cert.cert-loader"]
            })
            .register<IHttpClient>({
                name: "http.node-http-client",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog, certLoader: ICertificateLoader, serverCertValidator?: ServerCertValidator): Promise<IHttpClient> =>
                    buildNodeHttpClientAsync(log, certLoader, HttpProtocols.any, serverCertValidator),
                deps: ["logging", "cert.cert-loader"]
            })
            .register<IHttpClient>({
                name: "http.node-https-client",
                version: appUtils.getAppVersion(),
                descriptor: async (log: ILog, certLoader: ICertificateLoader, serverCertValidator?: ServerCertValidator): Promise<IHttpClient> =>
                    buildNodeHttpClientAsync(log, certLoader, HttpProtocols.https, serverCertValidator),
                deps: ["logging", "cert.cert-loader"]
            })
            .register<IHttpClient>({
                name: "http.electron-http-client",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog, serverCertValidator?: ServerCertValidator): Promise<IHttpClient> =>
                    buildElectronHttpClientAsync(log, HttpProtocols.any, serverCertValidator),
                deps: ["logging"]
            })
            .register<IHttpClient>({
                name: "http.electron-https-client",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog, serverCertValidator?: ServerCertValidator): Promise<IHttpClient> =>
                    buildElectronHttpClientAsync(log, HttpProtocols.https, serverCertValidator),
                deps: ["logging"]
            })
            .register<IHttpClientBuilder>({
                name: "http.node-client-builder",
                version: appUtils.getAppVersion(),
                descriptor: async (log: ILog, certLoader: ICertificateLoader, serverCertValidator?: ServerCertValidator) =>
                    new NodeHttpClientBuilder(log, certLoader, serverCertValidator),
                deps: ["logging", "cert.cert-loader"]
            })
            .register<IHttpClientBuilder>({
                name: "http.electron-client-builder",
                version: appUtils.getAppVersion(),
                descriptor: async (log: ILog, serverCertValidator?: ServerCertValidator) =>
                    new ElectronHttpClientBuilder(log, serverCertValidator),
                deps: ["logging"]
            })

            // Request Handlers
            .register<IAsyncHandlerConstructor<RequestAsyncProcessor>>({
                name: "http.request-handlers.handle-json",
                version: appUtils.getAppVersion(),
                descriptor: async () => handleJsonRequestAsync
            })

            // Response Handlers
            .register({
                name: "http.response-handlers.handle-redirection",
                version: appUtils.getAppVersion(),
                descriptor: async () => handleRedirectionResponseAsync
            })
            .register({
                name: "http.response-handlers.handle-json",
                version: appUtils.getAppVersion(),
                descriptor: async () => handleJsonResponseAsync
            })
            .register({
                name: "http.response-handlers.handle-auth-aad",
                version: appUtils.getAppVersion(),
                descriptor: (handlingHost: WebContents, aadMetadata: IAadMetadata) => handleAuthAadResponseAsync.bind(null, handlingHost, aadMetadata)
            })
            .register({
                name: "http.response-handlers.handle-auth-cert",
                version: appUtils.getAppVersion(),
                descriptor:
                    (certLoader: ICertificateLoader, pkiCertSvc: IPkiCertificateService, selectClientCertAsyncHandler: SelectClientCertAsyncHandler) =>
                        handleAuthCertResponseAsync.bind(null, certLoader, pkiCertSvc, selectClientCertAsyncHandler),
                deps: ["cert.cert-loader", "cert.pki-service"]
            });

        return {
            name: "http",
            version: appUtils.getAppVersion()
        };
    }
};
