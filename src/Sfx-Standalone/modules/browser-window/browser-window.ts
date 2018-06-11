//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary, IModuleManager } from "sfx";

import { dialog, BrowserWindow, app, BrowserWindowConstructorOptions, ipcMain } from "electron";
import * as url from "url";

import { env, Platform } from "../../utilities/env";
import * as authCert from "../../utilities/auth/cert";
import * as authAad from "../../utilities/auth/aad";
import * as appUtils from "../../utilities/appUtils";
import * as utils from "../../utilities/utils";
import { local } from "../../utilities/resolve";
import * as mmutils from "../../module-manager/utils";

function handleSslCert(window: BrowserWindow): void {
    let trustedCertManager: IDictionary<boolean> = {};

    window.webContents.on("certificate-error", (event, urlString, error, certificate, trustCertificate) => {
        event.preventDefault();

        let certIdentifier = url.parse(urlString).hostname + certificate.subjectName;

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

export default function createBrowserWindow(moduleManager: IModuleManager, options?: BrowserWindowConstructorOptions, handleAuth?: boolean, aadTargetHostName?: string): BrowserWindow {
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
            preload: local("./preload.js", false)
        }
    };

    if (Object.isObject(options)) {
        const webPreferences = windowOptions.webPreferences;

        Object.assign(webPreferences, options.webPreferences);
        Object.assign(windowOptions, options);
        windowOptions.webPreferences = webPreferences;
    }

    const window = new BrowserWindow(windowOptions);

    ipcMain.once("request-module-manager-constructor-options",
        (event: Electron.Event) => event.returnValue = mmutils.generateModuleManagerConstructorOptions(moduleManager));

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

    window.on("ready-to-show", () => window.show());

    return window;
}
