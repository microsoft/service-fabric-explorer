//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ISfxModuleManager } from "sfx.module-manager";

import { BrowserWindow, app, BrowserWindowConstructorOptions } from "electron";

import { local } from "donuts.node/path";
import * as utils from "donuts.node/utils";
import * as shell from "donuts.node/shell";
import * as appUtils from "../../utilities/appUtils";
import * as modularity from "donuts.node-modularity";

function handleNewWindow(window: BrowserWindow) {
    window.webContents.on("new-window",
        (event, urlString, frameName, disposition, options, additionalFeatures) => {
            event.preventDefault();
            shell.start(urlString);
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
    moduleManager: ISfxModuleManager)
    : void {
    if (!windowOptions.webPreferences) {
        windowOptions.webPreferences = Object.create(null);
    }

    windowOptions.webPreferences["additionalArguments"] = [
        shell.toCmdArg(
            modularity.CmdArgs.ConnectionInfo,
            JSON.stringify(modularity.getConnectionInfo(moduleManager)))];
}

export default async function createBrowserWindowAsync(
    moduleManager: ISfxModuleManager,
    options?: BrowserWindowConstructorOptions)
    : Promise<BrowserWindow> {

    const windowOptions: BrowserWindowConstructorOptions = {
        height: 768,
        width: 1024,
        show: false,
        icon: appUtils.getIconPath(),
        webPreferences: {
            preload: local("./preload.js"),
            nodeIntegration: true
        },
        title: "Service Fabric Explorer"
    };

    if (utils.isObject(options)) {
        const webPreferences = windowOptions.webPreferences;

        Object.assign(webPreferences, options.webPreferences);
        Object.assign(windowOptions, options);
        windowOptions.webPreferences = webPreferences;
    }

    addModuleManagerConstructorOptions(windowOptions, moduleManager);

    const window = new BrowserWindow(windowOptions);
    
    window.on("page-title-updated", (event, title) => event.preventDefault());
    window.setTitle(`${window.getTitle()} - ${app.getVersion()}`);

    handleNewWindow(window);

    if (process.platform !== "darwin") {
        handleZoom(window);
    }

    window.once("ready-to-show", () => window.show());

    return window;
}