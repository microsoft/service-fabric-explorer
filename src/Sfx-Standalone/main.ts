//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { app, Menu, MenuItemConstructorOptions } from "electron";
import * as uuidv5 from "uuid/v5";

import { env, Platform } from "./utilities/env";
import { resolve } from "./utilities/appUtils";

async function startup(): Promise<void> {
    const log = await sfxModuleManager.getComponentAsync("logging");
    log.writeInfoAsync("Application starting up ...");

    if (env.platform === Platform.MacOs) {
        const settings = await sfxModuleManager.getComponentAsync("settings");

        log.writeInfoAsync("Initialize application menu for macOS.");
        Menu.setApplicationMenu(
            Menu.buildFromTemplate(
                await settings.getAsync<Array<MenuItemConstructorOptions>>("defaultMenu/" + env.platform)));
    }

    log.writeInfoAsync("Starting up connect-cluster prompt.");
    const prompt_connectCluster = await sfxModuleManager.getComponentAsync("prompt.connect-cluster");
    const clusterUrl = await prompt_connectCluster.openAsync();

    if (clusterUrl) {
        // Start up the main window.
        global["TargetClusterUrl"] = clusterUrl;
        const mainWindow = await sfxModuleManager.getComponentAsync("browser-window", null, true, clusterUrl);

        mainWindow.setMenuBarVisibility(false);

        log.writeEventAsync("connect-cluster", { "clusterId": uuidv5(clusterUrl, uuidv5.URL) });
        mainWindow.loadURL(resolve("sfx/index.html"));
    } else {
        log.writeInfoAsync("No cluster url provided.");
        log.writeInfoAsync("app.quit().");

        app.quit();
        return;
    }

    // Trigger update activity.
    (await sfxModuleManager.getComponentAsync("update")).updateAsync();

    // Handle "window-all-closed" event.
    app.removeAllListeners("window-all-closed");
    app.once("window-all-closed", async () => {
        const log = await sfxModuleManager.getComponentAsync("logging");

        log.writeInfoAsync("'window-all-closed': app.quit().");
        app.quit();
    });

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
