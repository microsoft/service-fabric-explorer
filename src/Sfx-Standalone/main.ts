//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { app, Menu, MenuItemConstructorOptions } from "electron";
import { env, Platform } from "./utilities/env";
import * as url from "url";
import { IDictionary } from "sfx.common";
import * as authCert from "./utilities/auth/cert";

async function startup(): Promise<void> {
    const log = await sfxModuleManager.getComponentAsync("logging");
    log.writeInfoAsync("Application starting up ...");

    if (env.platform === Platform.MacOs) {
        const settings = await sfxModuleManager.getComponentAsync("settings");

        log.writeInfoAsync("Initialize application menu for macOS.");
        Menu.setApplicationMenu(Menu.buildFromTemplate(await settings.getAsync<Array<MenuItemConstructorOptions>>("defaultMenu/" + env.platform)));
    }

    log.writeInfoAsync("Starting up connect-cluster prompt.");
    const mainWindow = await sfxModuleManager.getComponentAsync("main-window");
    await mainWindow.loadAsync();

    // Handle "window-all-closed" event.
    app.removeAllListeners("window-all-closed");
    app.once("window-all-closed", async () => {
        const log = await sfxModuleManager.getComponentAsync("logging");

        log.writeInfoAsync("'window-all-closed': app.quit().");
        app.quit();
    });

    const trustedCertManager: IDictionary<boolean> = Object.create(null);
    app.on("certificate-error", (event, webContents, urlString, error, certificate, trustCertificate) => {
        const { dialog, BrowserWindow } = require("electron");
        const hostname = url.parse(urlString).hostname;

        event.preventDefault();

        if (hostname in trustedCertManager) {            
            trustCertificate(trustedCertManager[hostname]);
        } else {
            trustedCertManager[hostname] = false;

            dialog.showMessageBox(
                BrowserWindow.fromId(1),
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
                        return;
                    }

                    trustedCertManager[hostname] = true;
                    trustCertificate(true);
                });
        }
    });

    authCert.handleAuth(sfxModuleManager);

    // Trigger update activity.
    try {
        (await sfxModuleManager.getComponentAsync("update")).updateAsync();    
    } catch (error) {
        log.writeErrorAsync("error happens while updating the application", error);
    }

    log.writeInfoAsync("application startup finished.");
}

export default function (): Promise<void> {
    app.on("window-all-closed", (event) => undefined);

    if (app.isReady()) {
        return startup();
    }

    app.once("ready", startup);

    return Promise.resolve();
}
