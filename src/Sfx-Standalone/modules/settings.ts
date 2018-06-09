//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
import { IDictionary, IModuleInfo } from "sfx";
import { ISettings, ISettingsService } from "sfx.settings";

import * as path from "path";
import * as fs from "fs";

import * as utils from "../utilities/utils";
import { local } from "../utilities/resolve";
import * as fileSystem from "../utilities/fileSystem";
import { appCodeName } from "../utilities/appUtils";
import { electron } from "../utilities/electron-adapter";

class Settings implements ISettings {
    public readonly readonly: boolean;

    protected readonly settings: IDictionary<any>;

    private readonly parentSettings: ISettings;

    constructor(initialSettings?: IDictionary<any>, readonly?: boolean, parentSettings?: ISettings) {
        this.parentSettings = utils.isNullOrUndefined(parentSettings) ? undefined : parentSettings;
        this.readonly = utils.isNullOrUndefined(readonly) ? false : readonly;

        if (utils.isNullOrUndefined(initialSettings)) {
            this.settings = {};
        } else {
            this.settings = initialSettings;
        }
    }

    public get<T>(settingPath: string): T {
        if (!settingPath || !String.isString(settingPath)) {
            throw new Error(`Invalid setting path: ${settingPath}`);
        }

        let pathParts = settingPath.split("/");
        let settingValue: any = this.settings;

        for (let pathPartIndex = 0; pathPartIndex < pathParts.length; pathPartIndex++) {
            if (!Object.isObject(settingValue)) {
                settingValue = undefined;
                break;
            }

            settingValue = settingValue[pathParts[pathPartIndex]];
        }

        if (settingValue === undefined && this.parentSettings !== undefined) {
            return this.parentSettings.get(settingPath);
        }

        return settingValue;
    }

    public set<T>(settingPath: string, value: T): void {
        if (this.readonly) {
            throw new Error("Readonly settings cannot be modified.");
        }

        if (!settingPath || !String.isString(settingPath)) {
            throw new Error(`Invalid setting path: ${settingPath}`);
        }

        let pathParts = settingPath.split("/");
        let settingValue: any = this.settings;

        for (let pathPartIndex = 0; pathPartIndex < pathParts.length; pathPartIndex++) {
            if (!Array.isArray(settingValue) && !Object.isObject(settingValue)) {
                throw new Error("Unable to travel the settings path because the settings type is not array or object or it is null.");
            }

            let pathPart = pathParts[pathPartIndex];

            if (settingValue[pathPart] === undefined) {
                if (pathPartIndex === pathParts.length - 1) {
                    settingValue[pathPart] = value;
                } else {
                    settingValue[pathPart] = {};
                }
            }

            settingValue = settingValue[pathPart];
        }
    }
}

class FileSettings extends Settings {
    public readonly readOnly: boolean;

    private readonly settingsPath: string;

    constructor(settingsPath: string, readOnly?: boolean, parentSettings?: ISettings) {
        if (utils.isNullOrUndefined(settingsPath)) {
            throw new Error("settingsPath must be supplied.");
        }

        let initialSettings: any;

        if (!fs.existsSync(settingsPath)) {
            if (readOnly === true) {
                throw new Error(`Settings file, ${settingsPath}, doesn't exist.`);
            }

            initialSettings = {};
            fs.writeFileSync(settingsPath, JSON.stringify(initialSettings), { encoding: "utf8" });
        } else {
            initialSettings = JSON.parse(fs.readFileSync(settingsPath, { encoding: "utf8" }));

            if (utils.isNullOrUndefined(readOnly) || readOnly === false) {
                try {
                    fs.appendFileSync(settingsPath, "", { encoding: "utf8" });
                    readOnly = false;
                } catch (err) {
                    if (readOnly === false) {
                        throw new Error(`No permission to write settings file, {settingsPath}. error: {err}`);
                    } else {
                        readOnly = true;
                    }
                }
            }
        }

        super(initialSettings, readOnly, parentSettings);

        this.settingsPath = settingsPath;
    }

    get<T>(settingPath: string): T {
        return super.get(settingPath);
    }

    set<T>(settingPath: string, value: T): void {
        console.log(this.settingsPath);
        super.set(settingPath, value);
        fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings), { encoding: "utf8" });
    }
}

class SettingsService implements ISettingsService {

    private readonly appDir: string;

    private readonly defaultSettings: ISettings;

    private readonly appName: string;

    private readonly settingsDir: string;

    constructor() {
        let app = electron.app || electron.remote.app;

        this.appDir = app.getAppPath();
        this.appName = appCodeName;
        this.settingsDir = path.join(app.getPath("appData"), this.appName);

        fileSystem.ensureDirExists(this.settingsDir);

        this.defaultSettings = this.open("settings");
    }

    public get default(): ISettings {
        return this.defaultSettings;
    }

    /**
     * Open a set of settings as a settings chain. If the last settings doesn't support writing,
     * a new writable settings will be created and placed under appData to wrap the settings chain
     * as the last settings object, which provides a writing capability.
     * @param names the names of settings to be open as a settings chain.
     */
    public open(...names: Array<string>): ISettings {
        if (!Array.isArray(names)) {
            throw new Error("names must be an array of string.");
        }

        let parentSettings: ISettings = null;

        names.forEach(name => parentSettings = this.openSettings(parentSettings, name));

        if (parentSettings.readonly) {
            // if the last settings doesn't allow writing,
            // create a writable settings file in appData folder to wrap the readonly settings.
            parentSettings = new FileSettings(path.join(this.settingsDir, names[names.length - 1] + ".json"), false, parentSettings);
        }

        return parentSettings;
    }

    private openSettings(parentSettings: ISettings, name: string): ISettings {
        if (!String.isString(name)) {
            throw new Error("Invalid settings name!");
        }

        let settingsPath = local(name + ".json", true);

        if (!fs.existsSync(settingsPath)) {
            settingsPath = path.join(this.settingsDir, name + ".json");
        }

        return new FileSettings(settingsPath, null, parentSettings);
    }
}

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "settings",
        version: electron.app.getVersion(),
        components: [
            {
                name: "settings.service",
                version: electron.app.getVersion(),
                singleton: true,
                descriptor: () => new SettingsService()
            },
            {
                name: "settings",
                version: electron.app.getVersion(),
                singleton: true,
                descriptor: (settingsSvc: SettingsService) => settingsSvc.default,
                deps: ["settings.service"]
            }
        ]
    };
}
