//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "sfx.common";

import * as electron from "electron";

const ChannelName = "simple-context";

export enum ContextAction {
    Read = "read-context",
    Write = "write-context"
}

export declare function readContext(contextId: string): any;
export declare function writeContext(contextId: string, contextValue: any): void;

if (electron.ipcMain) {
    const context: IDictionary<any> = Object.create(null);

    electron.ipcMain.on(ChannelName,
        (event: Electron.Event, action: ContextAction, contextId: string, contextValue: any) => {
            if (ContextAction.Read === action) {
                event.returnValue = context[contextId];

            } else if (ContextAction.Write === action) {
                context[contextId] = contextValue;
                event.returnValue = true;
            }
        });

    exports.readContext = (contextId: string): any => {
        return context[contextId];
    };

    exports.writeContext = (contextId: string, contextValue: any): void => {
        context[contextId] = contextValue;
    };
} else if (electron.ipcRenderer) {
    exports.readContext = (contextId: string): any => {
        return electron.ipcRenderer.sendSync(ChannelName, ContextAction.Read, contextId);
    };

    exports.writeContext = (contextId: string, contextValue: any): void => {
        electron.ipcRenderer.sendSync(ChannelName, ContextAction.Write, contextId, contextValue);
    };
} else {
    // Not Supported: Only supported in Electron execution context.
}
