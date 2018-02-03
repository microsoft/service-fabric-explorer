// //-----------------------------------------------------------------------------
// // Copyright (c) Microsoft Corporation.  All rights reserved.
// // Licensed under the MIT License. See License file under the project root for license information.
// //-----------------------------------------------------------------------------
import { app, dialog, Menu, BrowserWindow } from "electron";
import * as uuidv5 from "uuid/v5";

import { ILog } from "./@types/log";
import { ISettings } from "./@types/settings";
import { env, Platform } from "./utilities/env";
import resolve, { local } from "./utilities/resolve";
import { ModuleManager } from "./module-manager/module-manager";
import { ModuleManagerHostAgent } from "./module-manager/module-manager-host";
import { DiDescriptorConstructor } from "./utilities/di.ext";

const moduleManager: IModuleManager = new ModuleManager(app.getVersion());

(function loadBuiltInModules(): void {
    const errors = moduleManager.loadModules(local("modules"));

    if (Object.isObject(errors)) {
        console.error("Failed to load built-in modules. Errors:");

        for (const topic in errors) {
            if (errors.hasOwnProperty(topic)) {
                console.error(topic);
                errors[topic].forEach((error) => console.error(error));
            }
        }

        app.exit(1);
    } else {
        const hostAgent = new ModuleManagerHostAgent(moduleManager);

        moduleManager.registerComponents([{
            name: "module-manager-host-agent",
            version: app.getVersion(),
            singleton: true,
            descriptor: DiDescriptorConstructor.singleton(hostAgent)
        }]);
    }
})();

app.setName("Service Fabric Explorer");

app.on("ready", () => {
    const log: ILog = moduleManager.getComponent("log");

    if (env.platform === Platform.MacOs) {
        const settings: ISettings = moduleManager.getComponent("settings");

        Menu.setApplicationMenu(
            Menu.buildFromTemplate(
                settings.get("defaultMenu/" + env.platform)));
    }

    moduleManager.getComponent("prompt-connect-cluster",
        (error, clusterUrl) => {
            if (clusterUrl) {
                global["TargetClusterUrl"] = clusterUrl;

                const mainWindow: BrowserWindow = moduleManager.getComponent("browser-window", null, true, clusterUrl);

                mainWindow.setMenuBarVisibility(false);

                log.writeEvent("connect-cluster", { "clusterId": uuidv5(clusterUrl, uuidv5.URL) });
                mainWindow.loadURL(resolve("sfx/index.html"));
            }
        });

    setTimeout(() => moduleManager.getComponent("update-service").update(), 1000); // Check upgrade after 1 sec.
});

app.on("window-all-closed", () => app.quit());
