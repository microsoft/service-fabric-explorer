//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as semver from "semver";
import { app, dialog } from "electron";
import * as tmp from "tmp";
import * as path from "path";
import * as url from "url";
import * as fs from "fs";

import { ILog } from "../@types/log";
import { IHttpClient } from "../@types/http";
import { ISettings } from "../@types/settings";
import { IUpdateService } from "../@types/update";
import * as utils from "../utilities/utils";
import error from "../utilities/errorUtil";
import { env, Architecture } from "../utilities/env";
import { ResponseHandlerHelper } from "./http";

interface IUpdateSettings {
    baseUrl: string;
    defaultChannel: string;
}

class UpdateService implements IUpdateService {
    private readonly log: ILog;
  
    private readonly settings: IUpdateSettings;

    private readonly httpClient: IHttpClient;

    constructor(log: ILog, updateSettings: IUpdateSettings, httpClient: IHttpClient) {
        if (!Object.isObject(log)) {
            throw error("log must be supplied.");
        }

        if (!Object.isObject(updateSettings)) {
            throw error("updateSettings must be supplied.");
        }

        if (!Object.isObject(httpClient)) {
            throw error("httpClient must be supplied.");
        }

        this.log = log;
        this.settings = updateSettings;
        this.httpClient = httpClient;
    }

    public update(): void {
        this.requestVersionInfo((error, versionInfo) => {
            if (!utils.isNullOrUndefined(error)) {
                this.log.writeError("Failed to check version info, error: {}", error.toString());
                return;
            }

            this.tryUpdate(versionInfo);
        });
    }

    public requestVersionInfo(callback: (error, versionInfo: IVersionInfo) => void): void {
        const prereleases = semver.prerelease(app.getVersion());
        let updateChannel: string;

        if (!utils.isNullOrUndefined(prereleases) && prereleases.length > 0) {
            updateChannel = prereleases[0];
        } else {
            updateChannel = this.settings.defaultChannel || "stable";
        }

        const versionInfoUrl =
            String.format(
                "{}/{}/{}",
                this.settings.baseUrl, // Update Base Url
                updateChannel,         // Channel
                env.platform);         // Platform

        try {
            this.log.writeInfo("Requesting version info json: {}", versionInfoUrl);
            this.httpClient.get(
                versionInfoUrl,
                ResponseHandlerHelper.handleJsonResponse<IVersionInfo>(callback));
        } catch (exception) {
            this.log.writeException(exception);
            callback(exception, null);
        }
    }

    private confirmUpate(versionInfo: IVersionInfo, path: string): void {
        let buttons = ["Yes", "No"];

        this.log.writeVerbose("Requesting update confirmation from the user ...");
        dialog.showMessageBox(
            {
                message: String.format("A newer version, {}, is found. Would you like to update now?", versionInfo.version),
                detail: versionInfo.description ? versionInfo.description : undefined,
                buttons: buttons,
                defaultId: 1
            },
            (response) => {
                this.log.writeInfo("Update confirmation result: {} ({})", buttons[response], response);
                switch (response) {
                    case 0: // Yes
                        this.log.writeVerbose("Applying the update package and quit the app: {}", path);
                        env.start(path);
                        app.quit();
                        break;

                    case 1: // No
                    default:
                        if (fs.existsSync(path)) {
                            fs.unlinkSync(path);
                            this.log.writeVerbose("Removed the local update package: {}", path);
                        }
                        break;
                }
            });
    }

    private getPackagePath(packageInfo: IPackageInfo): string {
        let packagePath = packageInfo[env.arch];

        if (!packagePath) {
            // fall back to x86 if the current one doesn't exist.
            packagePath = packageInfo[Architecture.X86];
            this.log.writeVerbose("Fall back to x86 for platform {} from arch {}.", env.platform, env.arch);
        }

        if (!packagePath) {
            this.log.writeError("Arch {1} is NOT found in {0} package info.", env.platform, env.arch);
            return null;
        }

        return packagePath;
    }

    private requestPackage(packagePath: string, callback: (error, filePath: string) => void): void {
        const tempFile: { name: string; fd: number } =
            tmp.fileSync({ keep: true, postfix: path.extname(packagePath) });
        this.log.writeInfo("Created temp file for the update package: {}", tempFile.name);

        try {
            this.log.writeInfo("Requesting the update package: {}", packagePath);
            this.httpClient.get(
                packagePath,
                ResponseHandlerHelper.saveToFile(tempFile.fd, true, (error) => callback(error, tempFile.name)));
        } catch (exception) {
            this.log.writeException(exception);
            callback(exception, null);
        }
    }

    private tryUpdate(versionInfo: IVersionInfo): void {
        if (semver.gte(app.getVersion(), versionInfo.version)) {
            this.log.writeInfo("No update needed: version => current: {} remote: {}", app.getVersion(), versionInfo.version);
            return;
        }

        let packageInfo: IPackageInfo | string = versionInfo[env.platform];
        let packagePath: string;

        if (!packageInfo) {
            this.log.writeError("No package info found for platform: {}.", env.platform);
            return;
        }

        if (String.isString(packageInfo)) {
            packagePath = packageInfo;

            try {
                this.confirmUpate(versionInfo, url.parse(packagePath).href);
            } catch (error) {
                this.log.writeException(error);
            }
        } else {
            packagePath = this.getPackagePath(packageInfo);

            this.requestPackage(packagePath, (error, filePath) => {
                if (String.isString(filePath)) {
                    this.confirmUpate(versionInfo, filePath);
                }
            });
        }
    }
}

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "http",
        version: "1.0.0",
        components: [
            {
                name: "update-service",
                version: "1.0.0",
                singleton: true,
                descriptor: (log: ILog, settings: ISettings, httpsClient: IHttpClient) => new UpdateService(log, settings.get("update"), httpsClient),
                deps: ["log", "settings", "https-client"]
            }
        ]
    };
}
