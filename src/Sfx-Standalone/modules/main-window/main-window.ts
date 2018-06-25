//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import "jquery";
import { IMainWindow, ISfxVueComponent, ISfxVueComponentRedneringOption } from "sfx.main-window";
import { BrowserWindow } from "electron";
import resolve from "../../utilities/resolve";

export class LocalSfxVueComponent implements ISfxVueComponent {

    public path: string;
    public option: ISfxVueComponentRedneringOption;

    constructor(_path: string) {
        this.path = _path;
    }

    render(container: JQuery): void {
        container.append("<p>this is one component...</p>");
    }
}

export class MainWindow implements IMainWindow {

    public components: ISfxVueComponent[] = [];
    public browserWindow: BrowserWindow;

    constructor(browserWindow: BrowserWindow) {
        this.browserWindow = browserWindow;
    }

    register(navComponent: ISfxVueComponent): void {
        this.components.push(navComponent);
    }

    loadComponents(): void {

        this.browserWindow.loadURL(resolve("index.html"));

        this.browserWindow.webContents.openDevTools();

        console.log(this.components);

        for (let index = 0; index < this.components.length; index++) {
            let component = this.components[index];
            //await import(component.path).then(component => {

                component.render($("div#cluster-manager > div.leftnav"));

                console.log(component);
            //});
        }
    }
}
