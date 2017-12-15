import { app } from "electron";
import * as path from "path";
import * as fs from "fs";
import * as util from "util";

import error from "./errorUtil";
import { local } from "./resolve";
import * as fileSystem from "./fileSystem";

export interface ISettings {
    readonly readOnly: boolean;

    get<T>(settingPath: string): T;

    set<T>(settingPath: string, value: T): void;
}

class Settings implements ISettings {
    public readonly readOnly: boolean;

    protected readonly settings: IDictionary<any>;

    private readonly parentSettings: ISettings;

    constructor(initialSettings?: IDictionary<any>, readOnly?: boolean, parentSettings?: ISettings) {
        this.parentSettings = util.isNullOrUndefined(parentSettings) ? undefined : parentSettings;
        this.readOnly = util.isNullOrUndefined(readOnly) ? false : readOnly;

        if (util.isNullOrUndefined(initialSettings)) {
            this.settings = {};
        } else {
            this.settings = initialSettings;
        }
    }

    public get<T>(settingPath: string): T {
        if (!settingPath || !util.isString(settingPath)) {
            throw error("Invalid setting path: %s", settingPath);
        }

        let pathParts = settingPath.split("/");
        let settingValue: any = this.settings;

        for (let pathPartIndex = 0; pathPartIndex < pathParts.length; pathPartIndex++) {
            if (!util.isArray(settingValue) && !util.isObject(settingValue)) {
                settingValue = undefined;
                break;
            }

            settingValue = settingValue[pathParts[pathPartIndex]];
        }

        if (util.isUndefined(settingValue) && !util.isUndefined(this.parentSettings)) {
            return this.parentSettings.get(settingPath);
        }

        return settingValue;
    }

    public set<T>(settingPath: string, value: T): void {
        if (this.readOnly) {
            throw error("Readonly settings cannot be modified.");
        }

        if (!settingPath || !util.isString(settingPath)) {
            throw error("Invalid setting path: %s", settingPath);
        }

        let pathParts = settingPath.split("/");
        let settingValue: any = this.settings;

        for (let pathPartIndex = 0; pathPartIndex < pathParts.length; pathPartIndex++) {
            if (!util.isArray(settingValue) && !util.isObject(settingValue)) {
                throw error("Unable to travel the settings path because the settings type is not array or object or it is null.");
            }

            let pathPart = pathParts[pathPartIndex];

            if (util.isUndefined(settingValue[pathPart])) {

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
        if (util.isNullOrUndefined(settingsPath)) {
            throw error("settingsPath must be supplied.");
        }

        let initialSettings: any;

        if (!fs.existsSync(settingsPath)) {
            if (readOnly === true) {
                throw error("Settings file, %s, doesn't exist.", settingsPath);
            }

            initialSettings = {};
            fs.writeFileSync(settingsPath, JSON.stringify(initialSettings), { encoding: "utf8" });
        } else {
            initialSettings = JSON.parse(fs.readFileSync(settingsPath, { encoding: "utf8" }));

            if (util.isNullOrUndefined(readOnly) || readOnly === false) {
                try {
                    fs.appendFileSync(settingsPath, "", { encoding: "utf8" });
                    readOnly = false;
                } catch (err) {
                    if (readOnly === false) {
                        throw error("No permission to write settings file, %s. error: %s", settingsPath, err);
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

class SettingsService {

    private readonly appDir: string;

    private readonly defaultSettings: ISettings;

    private readonly appName: string;

    private readonly settingsDir: string;

    constructor() {
        this.appDir = app.getAppPath();
        this.appName = app.getName();
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
        if (!util.isArray(names)) {
            throw error("names must be an array of string.");
        }

        let parentSettings: ISettings = null;

        names.forEach(name => parentSettings = this.openSettings(parentSettings, name));

        if (parentSettings.readOnly) {
            // if the last settings doesn't allow writing,
            // create a writable settings file in appData folder to wrap the readonly settings.
            parentSettings = new FileSettings(path.join(this.settingsDir, names[names.length - 1] + ".json"), false, parentSettings);
        }

        return parentSettings;
    }

    private openSettings(parentSettings: ISettings, name: string): ISettings {
        if (!util.isString(name)) {
            throw error("Invalid settings name!");
        }

        let settingsPath = local(name + ".json", true);

        if (!fs.existsSync(settingsPath)) {
            settingsPath = path.join(app.getPath("appData"), this.appName, name + ".json");
        }

        return new FileSettings(settingsPath, null, parentSettings);
    }
}

let settings = new SettingsService();

export default settings;
