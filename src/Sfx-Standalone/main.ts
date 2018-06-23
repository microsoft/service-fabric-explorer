//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { app, Menu } from "electron";
import * as uuidv5 from "uuid/v5";

import { env, Platform } from "./utilities/env";
import resolve, { local } from "./utilities/resolve";
import { ModuleManager } from "./module-manager/module-manager";
import * as appUtils from "./utilities/appUtils";

// Initialize main module manager.
global["sfxModuleManager"] = new ModuleManager(app.getVersion());

app.setName("Service Fabric Explorer");

async function loadExtensions(): Promise<void> {
    const log = await sfxModuleManager.getComponentAsync("logging");
    const packageManager = await sfxModuleManager.getComponentAsync("package-manager");
    const exentsionsHostName = "exenstions";

    log.writeInfo(`Loading exentsions in the directory "${packageManager.packagesDir}" to module host (${exentsionsHostName}) ...`);
    await sfxModuleManager.loadModuleDirAsync(packageManager.packagesDir, exentsionsHostName);

    const adhocModuleArg = appUtils.getCmdArg("adhocModule");

    if (adhocModuleArg) {
        log.writeInfo(`Loading ad-hoc module: ${adhocModuleArg} ...`);
        await sfxModuleManager.loadModuleAsync(adhocModuleArg, exentsionsHostName);
    }
}

(() => {
    const startingUpPromise =
        sfxModuleManager
            .loadModuleDirAsync(local("modules"))
            .then(() => loadExtensions());

    app.once("ready", async () => {
        await startingUpPromise;

        const log = await sfxModuleManager.getComponentAsync("logging");
        log.writeInfo("'ready': Application starting up ...");

        if (env.platform === Platform.MacOs) {
            const settings = await sfxModuleManager.getComponentAsync("settings");

            log.writeInfo("'ready': Initialize application menu for macOS.");
            Menu.setApplicationMenu(
                Menu.buildFromTemplate(
                    settings.get("defaultMenu/" + env.platform)));
        }

        log.writeInfo("'ready': Starting up connect-cluster prompt.");
        const prompt_connectCluster = await sfxModuleManager.getComponentAsync("prompt.connect-cluster");
        const clusterUrl = await prompt_connectCluster.openAsync();

        if (clusterUrl) {
            global["TargetClusterUrl"] = clusterUrl;
            const mainWindow = await sfxModuleManager.getComponentAsync("browser-window", null, true, clusterUrl);

            mainWindow.setMenuBarVisibility(false);

            log.writeEvent("connect-cluster", { "clusterId": uuidv5(clusterUrl, uuidv5.URL) });
            mainWindow.loadURL(resolve("sfx/index.html"));
        } else {
            log.writeInfo("'ready': No cluster url provided.");
            log.writeInfo("'ready': app.quit().");

            app.quit();
            return;
        }

        setTimeout(async () => (await sfxModuleManager.getComponentAsync("update")).updateAsync(), 1000); // Check upgrade after 1 sec.

        app.removeAllListeners("window-all-closed");
        app.once("window-all-closed", async () => {
            const log = await sfxModuleManager.getComponentAsync("logging");

            log.writeInfo("'window-all-closed': app.quit().");
            app.quit();
        });

        log.writeInfo("'ready': application startup finished.");
    });

    app.on("window-all-closed", (event) => undefined);
})();
