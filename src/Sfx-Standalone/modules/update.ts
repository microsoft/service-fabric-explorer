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
    private readonly settings: IUpdateSettings;

    private readonly httpClient: IHttpClient;

    private static confirmUpate(versionInfo: IVersionInfo, path: string): void {
        let buttons = ["Yes", "No"];

        dialog.showMessageBox(
            {
                message: String.format("A newer version, {}, is found. Would you like to update now?", versionInfo.version),
                detail: versionInfo.description ? versionInfo.description : undefined,
                buttons: buttons,
                defaultId: 1
            },
            (response) => {
                //logInfo("The user response whether to apply the update: {} ({})", buttons[response], response);
                switch (response) {
                    case 0: // Yes
                        //logInfo("Applying the update package and quit the app.");
                        env.start(path);
                        app.quit();
                        break;

                    case 1: // No
                    default:
                        if (fs.existsSync(path)) {
                            fs.unlinkSync(path);
                            //logInfo("Removed the local update package.");
                        }
                        break;
                }
            });
    }

    private static getPackagePath(packageInfo: IPackageInfo): string {
        let packagePath = packageInfo[env.arch];

        if (!packagePath) {
            //logInfo("Fall back to x86 for platform {}. (current arch: {})", env.platform, env.arch);
            // fall back to x86 if the current one doesn't exist.
            packagePath = packageInfo[Architecture.X86];
        }

        if (!packagePath) {
            //logError("Architecture {} is NOT found in {} package info.", env.arch, env.platform);
            return null;
        }

        return packagePath;
    }

    constructor(updateSettings: IUpdateSettings, httpClient: IHttpClient) {
        if (!Object.isObject(updateSettings)) {
            throw error("updateSettings must be supplied.");
        }

        if (!Object.isObject(httpClient)) {
            throw error("httpClient must be supplied.");
        }

        this.settings = updateSettings;
        this.httpClient = httpClient;
    }

    public update(): void {
        this.requestVersionInfo((error, versionInfo) => {
            if (error || semver.gte(app.getVersion(), versionInfo.version)) {
                return;
            }

            let packageInfo: IPackageInfo | string = versionInfo[env.platform];
            let packagePath: string;

            if (!packageInfo) {
                //logError("No package info found for platform: {}.", env.platform);
                return;
            }

            if (String.isString(packageInfo)) {
                packagePath = packageInfo;

                try {
                    UpdateService.confirmUpate(versionInfo, url.parse(packagePath).href);
                } catch (error) {
                    //logError("Invalid packagePath: {}", packagePath);
                }
            } else {
                packagePath = UpdateService.getPackagePath(packageInfo);

                this.requestPackage(packagePath, (error, filePath) => {
                    if (String.isString(filePath)) {
                        UpdateService.confirmUpate(versionInfo, filePath);
                    }
                });
            }
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
            this.httpClient.get(
                versionInfoUrl,
                ResponseHandlerHelper.handleJsonResponse<IVersionInfo>(callback));
        } catch (exception) {
            // write log.
            callback(exception, null);
        }
    }

    private requestPackage(packagePath: string, callback: (error, filePath: string) => void): void {
        const tempFile: { name: string; fd: number } =
            tmp.fileSync({ keep: true, postfix: path.extname(packagePath) });
        //logInfo("Created temp file for the update package: {}", tempFile.name);

        //logInfo("Retrieving the update package: {} ...", packagePath);
        try {
            this.httpClient.get(
                packagePath,
                ResponseHandlerHelper.saveToFile(tempFile.fd, true, (error) => callback(error, tempFile.name)));
        } catch (exception) {
            // log exception.
            callback(exception, null);
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
                descriptor: (settings: ISettings, httpsClient: IHttpClient) => new UpdateService(settings.get("update"), httpsClient),
                deps: ["settings", "https-client"]
            }
        ]
    };
}
