//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { app, BrowserWindow, ipcMain, remote } from "electron";

interface IElectronAdapter {
    app: typeof app;
    BrowserWindow: typeof BrowserWindow;
    ipcMain: typeof ipcMain;
}

let electron: IElectronAdapter;

if (remote) {
    electron = remote;
} else {
    electron = {
        app: app,
        BrowserWindow: BrowserWindow,
        ipcMain: ipcMain
    };
}

export default electron;
