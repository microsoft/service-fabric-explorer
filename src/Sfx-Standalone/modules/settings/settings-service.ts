//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ISettings, ISettingsService } from "sfx.settings";

import * as path from "path";
import * as fs from "fs";

import * as fileSystem from "../../utilities/fileSystem";
import * as appUtils from "../../utilities/appUtils";
import { electron } from "../../utilities/electron-adapter";
import Settings from "./settings";
import FileSettings from "./file-settings";

export default class SettingsService implements ISettingsService {

    private readonly userDataDir: string;

    private defaultSettings: ISettings;

    constructor() {
        this.userDataDir = electron.app.getPath("userData");

        fileSystem.ensureDirExists(this.userDataDir);
    }

    public get default(): Promise<ISettings> {
        return this.defaultSettings ? Promise.resolve(this.defaultSettings) : this.openAsync("settings").then((settings) => this.defaultSettings = settings);
    }

    /**
     * Open a set of settings as a settings chain. If the last settings doesn't support writing,
     * a new writable settings will be created and placed under userData to wrap the settings chain
     * as the last settings object, which provides a writing capability.
     * @param names the names of settings to be open as a settings chain.
     */
    public openAsync(...names: Array<string>): Promise<ISettings> {
        if (!Array.isArray(names)) {
            throw new Error("names must be an array of string.");
        }

        let parentSettings: ISettings = null;

        names.forEach(name => parentSettings = this.openSettings(parentSettings, name));

        if ((<Settings>parentSettings).readonly) {
            // if the last settings doesn't allow writing,
            // create a writable settings file in appData folder to wrap the readonly settings.
            parentSettings = new FileSettings(path.join(this.userDataDir, names[names.length - 1] + ".json"), false, parentSettings);
        }

        return Promise.resolve(parentSettings);
    }

    private openSettings(parentSettings: ISettings, name: string): ISettings {
        if (!String.isString(name)) {
            throw new Error("Invalid settings name!");
        }

        let settingsPath = appUtils.local(name + ".json", true);

        if (!fs.existsSync(settingsPath)) {
            settingsPath = path.join(this.userDataDir, name + ".json");
        }

        return new FileSettings(settingsPath, null, parentSettings);
    }
}
