//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "sfx.common";
import { IModuleManager } from "sfx.module-manager";

import { dialog, BrowserWindow, app, BrowserWindowConstructorOptions } from "electron";
import * as url from "url";
import * as uuidv5 from "uuid/v5";

import { env, Platform } from "../../utilities/env";
import * as authCert from "../../utilities/auth/cert";
import * as authAad from "../../utilities/auth/aad";
import * as appUtils from "../../utilities/appUtils";
import * as utils from "../../utilities/utils";
import { ModuleManager } from "../../module-manager/module-manager";

const UuidNamespace = "614e2e95-a80d-4ee5-9fd5-fb970b4b01a3";

function handleSslCert(window: BrowserWindow): void {
    const trustedCertManager: IDictionary<boolean> = Object.create(null);

    window.webContents.on("certificate-error", (event, urlString, error, certificate, trustCertificate) => {
        event.preventDefault();

        const certIdentifier = url.parse(urlString).hostname + certificate.subjectName;

        if (certIdentifier in trustedCertManager) {
            trustCertificate(trustedCertManager[certIdentifier]);
        } else {
            trustedCertManager[certIdentifier] = false;

            dialog.showMessageBox(
                window,
                {
                    type: "warning",
                    buttons: ["Yes", "Exit"],
                    title: "Untrusted certificate",
                    message: "Do you want to trust this certificate?",
                    detail: "Subject: " + certificate.subjectName + "\r\nIssuer: " + certificate.issuerName + "\r\nThumbprint: " + certificate.fingerprint,
                    cancelId: 1,
                    defaultId: 0,
                    noLink: true,
                },
                (response, checkboxChecked) => {
                    if (response !== 0) {
                        app.quit();
                        return;
                    }

                    trustedCertManager[certIdentifier] = true;
                    trustCertificate(true);
                });
        }
    });
}

function handleNewWindow(window: BrowserWindow) {
    window.webContents.on("new-window",
        (event, urlString, frameName, disposition, options, additionalFeatures) => {
            event.preventDefault();
            env.start(urlString);
        });
}

function handleZoom(window: BrowserWindow) {
    let zoomLevel = 0;

    window.webContents.setZoomLevel(zoomLevel);

    window.webContents.on("before-input-event",
        (event, input) => {
            if (input.control) {
                if (input.type === "keyUp" && input.code === "Digit0") {
                    window.webContents.setZoomLevel(0);
                } else if (input.type === "keyDown") {
                    switch (input.code) {
                        case "Equal":
                            window.webContents.setZoomLevel(++zoomLevel);
                            break;
                        case "Minus":
                            window.webContents.setZoomLevel(--zoomLevel);
                            break;
                        default:
                            break;
                    }
                }
            }
        });
}

function addModuleManagerConstructorOptions(
    windowOptions: BrowserWindowConstructorOptions,
    moduleManager: IModuleManager)
    : void {
    if (!windowOptions.webPreferences) {
        windowOptions.webPreferences = Object.create(null);
    }

    windowOptions.webPreferences["additionalArguments"] = [
        appUtils.toCmdArg(
            ModuleManager.ConstructorOptionsCmdArgName,
            JSON.stringify(moduleManager.generateConstructorOptions()))];
}

export default async function createBrowserWindowAsync(
    moduleManager: IModuleManager,
    options?: BrowserWindowConstructorOptions,
    handleAuth?: boolean,
    aadTargetHostName?: string)
    : Promise<BrowserWindow> {

    handleAuth = utils.getValue(handleAuth, false);

    if (handleAuth && String.isEmptyOrWhitespace(aadTargetHostName)) {
        throw new Error("if auth handling is required, aadTargetHostName must be supplied.");
    }

    const windowOptions: BrowserWindowConstructorOptions = {
        height: 768,
        width: 1024,
        show: false,
        icon: appUtils.getIconPath(),
        webPreferences: {
            preload: appUtils.local("./preload.js"),
            nodeIntegration: true
        }
    };

    if (Object.isObject(options)) {
        const webPreferences = windowOptions.webPreferences;

        Object.assign(webPreferences, options.webPreferences);
        Object.assign(windowOptions, options);
        windowOptions.webPreferences = webPreferences;
    }

    addModuleManagerConstructorOptions(windowOptions, moduleManager);
    
    const window = new BrowserWindow(windowOptions);
    const hostName = uuidv5(window.id.toString(), UuidNamespace);

    await moduleManager.newHostAsync(hostName, await moduleManager.getComponentAsync("ipc.communicator", window.webContents));

    window.on("page-title-updated", (event, title) => event.preventDefault());
    window.setTitle(`${window.getTitle()} - ${app.getVersion()}`);

    handleSslCert(window);
    handleNewWindow(window);

    if (env.platform !== Platform.MacOs) {
        handleZoom(window);
    }

    if (handleAuth) {
        authCert.handle(moduleManager, window);
        authAad.handle(window, aadTargetHostName);
    }

    window.once("closed", async () => await moduleManager.destroyHostAsync(hostName));
    window.once("ready-to-show", () => window.show());

    return window;
}
