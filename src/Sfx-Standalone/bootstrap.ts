//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as ipc from "donuts.node-ipc";
import { CommunicationHost } from "donuts.node-remote/communication-host";
import { SocketHostProxy } from "donuts.node-remote/proxy/socket-host-proxy";
import * as modularity from "donuts.node-modularity";
import * as path from "path";
import * as fs from "fs";
import { local } from "donuts.node/path";
import * as shell from "donuts.node/shell";

// TODO: Remove startupMainWindow once the main frame is ready.
import startupMainWindow from "./main";

function createModuleManager(): Donuts.Modularity.IModuleManager {
    const segmentSeparator = process.platform === "win32" ? "\\" : "/";
    const ipcSegments = path.join(process.execPath, process.pid.toString(), "module-manager").split(segmentSeparator);
    const ipcHost = ipc.host(...ipcSegments);

    return modularity.createModuleManager(new CommunicationHost(new SocketHostProxy(ipcHost)));
}

function readModuleDir(dirName: string): Array<string> {
    const dirPath: string = local(dirName);
    const entries: Array<string> = [];

    for (const entry of fs.readdirSync(dirPath, { encoding: "utf8" })) {
        entries.push(path.join(dirPath, entry));
    }

    return entries;
}

process.once("loaded", () => Promise.resolve(createModuleManager())
    // Load built-in modules.
    .then((moduleManager) => moduleManager.loadModulesAsync(readModuleDir("modules")))

    // Load ad-hoc module
    .then((moduleManager) => {
        const adhocModuleArg = shell.getCmdArg("adhocModule");

        if (adhocModuleArg) {
            return moduleManager.loadModulesAsync([adhocModuleArg]);
        }

        return Promise.resolve(moduleManager);
    })

    // Start up main window.
    .then((moduleManager) => startupMainWindow())
);
