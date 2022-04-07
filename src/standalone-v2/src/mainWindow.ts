import { BrowserView, BrowserWindow, IpcMainEvent } from "electron";
import { join } from 'path';
import { ICluster } from "./cluster-manager";
import { ConfigLoader } from "./configLoader";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

export interface AddWindowEvent {
    id: string;
    url: string;
    name: string;
    queryParam?: string;
}

export type IPCWindowCallback = (event: IpcMainEvent, ...args: any[]) => void;

export interface IWindowIPCItems {
    eventName: string;
    callBack: IPCWindowCallback;
}

export class MainWindow {
    private browserWindow: BrowserWindow;
    private windows: Record<string, BrowserView> = {};

    constructor(browserWindow: BrowserWindow, private config: ConfigLoader) {
        this.browserWindow = browserWindow;
        browserWindow.setPosition(100, 100);
        browserWindow.setSize(1500, 1200);
        browserWindow.setMenuBarVisibility(true);
        if(this.config.isDevTools) {
            browserWindow.webContents.openDevTools({mode: 'detach'});
        }
    }

    async loadAsync(): Promise<void> {
        return new Promise(async (resolve) => {
            this.browserWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

            this.browserWindow.once("ready-to-show", () => {

                this.browserWindow.show();
                resolve();
            });
        })
    }

    async addWindow(data: ICluster) {
        const { id, url } = data;
        if (this.windows[id]) {
            this.setActiveWindow(id);
            return;
        }

        let view = new BrowserView({
            webPreferences: {
                preload: join(__dirname,'..', 'renderer', 'main_window', 'preload.js')
            }
        })

        view.setAutoResize({ width: true, height: true });
        const bounds = this.browserWindow.getBounds()
        const offSetX = 300;
        const offsetY = 0;
        view.setBounds({ x: offSetX, y: offsetY, width: (bounds.width - offSetX - 15), height: (bounds.height - offsetY) })
        view.webContents.loadFile(join(__dirname, "sfx", 'index.html'), {query: {'targetcluster': data.displayName}});

        if(this.config.isDevTools) {
            view.webContents.toggleDevTools();
        }

        this.windows[id] = view;

        this.browserWindow.addBrowserView(this.windows[id]);

        this.setActiveWindow(id);

        return view.webContents.id;
    }

    async setActiveWindow(id: string) {
        this.browserWindow.setTopBrowserView(this.windows[id]);
    }

    async restartWindow(id: string) {
        this.windows[id].webContents.reload();
    }

    async removeWindow(id: string) {
        if(this.windows[id]) {
            const windowId = this.windows[id].webContents.id;
            this.browserWindow.removeBrowserView(this.windows[id]);
            (this.windows[id].webContents as any).destroy()
            this.windows[id] = null;
            return windowId;
        }
    }

    getWindow() {
        return this.browserWindow;
    }
}