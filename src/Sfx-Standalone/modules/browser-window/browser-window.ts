//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleManager } from "sfx.module-manager";
import { BrowserWindow, app, BrowserWindowConstructorOptions } from "electron";
import * as uuidv5 from "uuid/v5";
import { env, Platform } from "../../utilities/env";
import * as appUtils from "../../utilities/appUtils";
import { ModuleManager } from "../../module-manager/module-manager";

const UuidNamespace = "614e2e95-a80d-4ee5-9fd5-fb970b4b01a3";

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
    options?: BrowserWindowConstructorOptions)
    : Promise<BrowserWindow> {

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

    //handleSslCert(window);
    handleNewWindow(window);

    if (env.platform !== Platform.MacOs) {
        handleZoom(window);
    }

    window.once("closed", async () => await moduleManager.destroyHostAsync(hostName));
    window.once("ready-to-show", () => window.show());

    return window;
}
