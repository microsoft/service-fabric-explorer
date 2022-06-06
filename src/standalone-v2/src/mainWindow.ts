import { BrowserView, BrowserWindow, IpcMainEvent } from "electron";
import { join } from 'path';
import { ConfigLoader } from "./configLoader";
import { ILogger } from "./logger";
import { NotificationTypes } from "./notificationManager";
import { Subject } from "./observable";

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

export interface IWindowConfig {
    id: string;
    url: string;
    queryParams?: Record<string, string>;
    preload?: string;
}


export class MainWindow {
    private browserWindow: BrowserWindow;
    private windows: Record<string, BrowserView> = {};

    private registeredSingletonPages: IWindowConfig[] = [];
    public registeredSingletonPagesChanges = new Subject<IWindowConfig[]>();

    constructor(browserWindow: BrowserWindow, private config: ConfigLoader, private logger: ILogger) {
        this.browserWindow = browserWindow;
        browserWindow.setPosition(100, 100);
        browserWindow.setSize(1500, 1200);
        browserWindow.setMenuBarVisibility(true);
        if(this.config.isDevTools) {
            browserWindow.webContents.openDevTools({mode: 'detach'});
        }
        
        this.logger.log(NotificationTypes.Info, 'initialized browser Window')
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

    async addWindow(config:  IWindowConfig) {
        const { id, url, queryParams } = config;
        if (this.windows[id]) {
            this.setActiveWindow(id);
            return;
        }

        let view = new BrowserView({
            webPreferences: {
                preload: config.preload || join(__dirname,'..', 'renderer', 'main_window', 'preload.js')
            }
        })

        view.setAutoResize({ width: true, height: true });
        const bounds = this.browserWindow.getContentBounds()
        const offSetX = 300;
        const offsetY = 0;
        view.setBounds({ x: offSetX, y: offsetY, width: (bounds.width - offSetX), height: (bounds.height - offsetY) })
        view.webContents.loadFile(url, {query: queryParams});

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

    registerSingletonView(view:IWindowConfig) {
        this.registeredSingletonPages.push(view);
        this.registeredSingletonPagesChanges.emit(this.registeredSingletonPages);
    }
}