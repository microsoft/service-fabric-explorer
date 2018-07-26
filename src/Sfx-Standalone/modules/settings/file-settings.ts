//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ISettings } from "sfx.settings";

import * as fs from "fs";

import * as utils from "../../utilities/utils";
import Settings from "./settings";

export default class FileSettings extends Settings {
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
