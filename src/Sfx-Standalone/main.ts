//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { app, Menu, MenuItemConstructorOptions } from "electron";

async function startup(): Promise<void> {
    const log = await sfxModuleManager.getComponentAsync("logging.default");
    log.writeInfoAsync("Application starting up ...");

    if (process.platform === "darwin") {
        const settings = await sfxModuleManager.getComponentAsync("settings.default");

        log.writeInfoAsync("Initialize application menu for macOS.");
        Menu.setApplicationMenu(
            Menu.buildFromTemplate(
                await settings.getAsync<Array<MenuItemConstructorOptions>>("defaultMenu/" + process.platform)));
    }

    log.writeInfoAsync("Starting up connect-cluster prompt.");
    const mainWindow = await sfxModuleManager.getComponentAsync("sfx.main-window");
    await mainWindow.loadAsync();

    // Handle "window-all-closed" event.
    app.removeAllListeners("window-all-closed");
    app.once("window-all-closed", async () => {
        (await sfxModuleManager.getComponentAsync("logging.default")).writeInfoAsync("'window-all-closed': app.quit().");
        app.quit();
    });

    // Trigger update activity.
    try {
        (await sfxModuleManager.getComponentAsync("update.service")).updateAsync();    
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