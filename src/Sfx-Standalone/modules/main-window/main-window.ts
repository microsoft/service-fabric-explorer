//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import { IMainWindow, ISfxVueComponent, ISfxVueComponentRedneringOption } from "sfx.main-window";
import { BrowserWindow } from "electron";
import { resolve } from "../../utilities/appUtils";

export class LocalSfxVueComponent implements ISfxVueComponent {

    path: string;
    title: string;
    iconUrl: string;
    viewPageUrl: string;

    public option: ISfxVueComponentRedneringOption;

    constructor(_path: string) {
        this.path = _path;
    }

    render(container: JQuery): void {
        try {
            let $component = $(`
            <div class="component-title">
                <lable>Cluster Manager</label>
                <div><button id="add-cluster"> + </button></div>
                <ul id="cluster-list">
                </ul>
            </div>`);
    
            container.append($component);
    
            $("button#add-cluster", $component).click(() => {
                console.log("button clicked");
            });    
        } catch (error) {
            console.log(error);
        }        
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
        this.browserWindow.once("ready-to-show", () => {
            this.browserWindow.webContents.openDevTools();
            console.log(this.components);
            this.browserWindow.show();

            //this.renderComponents();
        });
    }

    renderComponents(container: JQuery): void {
        
        for (let index = 0; index < this.components.length; index++) {
            let component = this.components[index];
            component.render(container);
        }
    }
}


$(document).ready(async () => {
    console.log("document.ready");

    try {
        let app = await sfxModuleManager.getComponentAsync("main-window");
        app.renderComponents($("div#leftpanel"));
    } catch (error) {
        console.log(error);
    }
});
