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
