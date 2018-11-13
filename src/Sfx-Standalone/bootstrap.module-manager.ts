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
import * as appUtils from "./utilities/appUtils";
import { ISfxModuleManager } from "sfx.module-manager";

function createModuleManager(): Donuts.Modularity.IModuleManager {
    const segmentSeparator = process.platform === "win32" ? "\\" : "/";
    const ipcSegments = path.join(shell.getDir("Temp"), `${path.basename(process.execPath)}-${process.pid}`, "module-manager").split(segmentSeparator);
    const ipcHost = ipc.host(...ipcSegments);

    return modularity.createModuleManager(new CommunicationHost(new SocketHostProxy(ipcHost)));
}

function readModuleDir(dirs: Array<string>): Array<string> {
    const entries: Array<string> = [];
    let dirPath: string;

    while (dirPath = dirs.pop()) {
        dirPath = local(dirPath);

        if (!fs.existsSync(dirPath)) {
            continue;
        }

        for (const entry of fs.readdirSync(dirPath, { encoding: "utf8" })) {
            const entryPath = path.join(dirPath, entry);

            if (!entry.endsWith(".js")) {
                const stat = fs.statSync(entryPath);

                if (!stat.isDirectory()) {
                    continue;
                }
            }

            entries.push(entryPath);
        }
    }

    return entries;
}

export async function bootstrap(): Promise<ISfxModuleManager> {
    const modulePaths: Array<string> = ["./modules.local"];

    if (shell.getCmdArg(modularity.CmdArgs.ConnectionInfo)) {        
        require("donuts.node-modularity/bootstrap");

    } else {        
        modularity.setModuleManager(createModuleManager());
        modulePaths.push("./modules");
    }

    const moduleManager = modularity.getModuleManager();    
    await moduleManager.loadModulesAsync(readModuleDir(modulePaths));

    return appUtils.injectModuleManager(moduleManager);
}
