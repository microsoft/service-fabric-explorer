//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
import { IDictionary } from "sfx.common";
import { IModuleInfo, IModule } from "sfx.module-manager";
import { ISettings, ISettingsService } from "sfx.settings";

import * as path from "path";
import * as fs from "fs";

import * as utils from "../utilities/utils";
import * as fileSystem from "../utilities/fileSystem";
import * as appUtils from "../utilities/appUtils";
import { electron } from "../utilities/electron-adapter";

class Settings implements ISettings {
    public readonly readonly: boolean;

    protected readonly settings: IDictionary<any>;

    private readonly parentSettings: ISettings;

    constructor(initialSettings?: IDictionary<any>, readonly?: boolean, parentSettings?: ISettings) {
        this.parentSettings = utils.isNullOrUndefined(parentSettings) ? undefined : parentSettings;
        this.readonly = utils.isNullOrUndefined(readonly) ? false : readonly;

        if (utils.isNullOrUndefined(initialSettings)) {
            this.settings = Object.create(null);
        } else {
            this.settings = initialSettings;
        }
    }

    public getAsync<T>(settingPath: string): Promise<T> {
        if (!settingPath || !String.isString(settingPath)) {
            throw new Error(`Invalid setting path: ${settingPath}`);
        }

        const pathParts = settingPath.split("/");
        let settingValue: any = this.settings;

        for (let pathPartIndex = 0; pathPartIndex < pathParts.length; pathPartIndex++) {
            if (!Object.isObject(settingValue)) {
                settingValue = undefined;
                break;
            }

            settingValue = settingValue[pathParts[pathPartIndex]];
        }

        if (settingValue === undefined && this.parentSettings !== undefined) {
            return this.parentSettings.getAsync(settingPath);
        }

        return Promise.resolve(settingValue);
    }

    public async setAsync<T>(settingPath: string, value: T): Promise<void> {
        if (this.readonly) {
            throw new Error("Readonly settings cannot be modified.");
        }

        if (!settingPath || !String.isString(settingPath)) {
            throw new Error(`Invalid setting path: ${settingPath}`);
        }

        const pathParts = settingPath.split("/");
        let settingValue: any = this.settings;

        for (let pathPartIndex = 0; pathPartIndex < pathParts.length; pathPartIndex++) {
            if (settingValue === null || (!Array.isArray(settingValue) && !Object.isObject(settingValue))) {
                throw new Error("Unable to travel the settings path because the settings type is not array or object or it is null.");
            }

            const pathPart = pathParts[pathPartIndex];

            if (pathPartIndex === pathParts.length - 1) {
                if (value === undefined) {
                    delete settingValue[pathPart];
                } else {
                    settingValue[pathPart] = value;
                }
            } else if (settingValue[pathPart] === undefined) {
                settingValue[pathPart] = Object.create(null);
            }

            settingValue = settingValue[pathPart];
        }
    }
}

class FileSettings extends Settings {
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

            initialSettings = Object.create(null);
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

    public getAsync<T>(settingPath: string): Promise<T> {
        return super.getAsync<T>(settingPath);
    }

    public async set<T>(settingPath: string, value: T): Promise<void> {
        await super.setAsync<T>(settingPath, value);

        fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 4), { encoding: "utf8" });
    }
}

class SettingsService implements ISettingsService {

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

(<IModule>exports).getModuleMetadata = (components): IModuleInfo => {
    components
        .register<ISettingsService>({
            name: "settings.service",
            version: appUtils.getAppVersion(),
            singleton: true,
            descriptor: async () => new SettingsService()
        })
        .register<ISettings>({
            name: "settings",
            version: appUtils.getAppVersion(),
            singleton: true,
            descriptor: async (settingsSvc: SettingsService) => settingsSvc.default,
            deps: ["settings.service"]
        });

    return {
        name: "settings",
        version: appUtils.getAppVersion()
    };
};
