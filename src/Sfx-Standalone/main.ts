//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { app, Menu, MenuItemConstructorOptions } from "electron";
import { env, Platform } from "./utilities/env";

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

    // Trigger update activity.
    (await sfxModuleManager.getComponentAsync("update")).updateAsync();

    // Handle "window-all-closed" event.
    app.removeAllListeners("window-all-closed");
    app.once("window-all-closed", async () => {
        const log = await sfxModuleManager.getComponentAsync("logging");

        log.writeInfoAsync("'window-all-closed': app.quit().");
        app.quit();
    });

    // app.on("certificate-error", (event, webContents, url, error, certificate, callback) => {
    //     event.preventDefault();
    //     callback(true);
    // });

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
