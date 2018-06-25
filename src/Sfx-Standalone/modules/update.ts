//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
import { IVersionInfo, IPackageInfo } from "sfx.common";
import { IModuleInfo } from "sfx.module-manager";
import { ISettings } from "sfx.settings";
import { ILog } from "sfx.logging";
import { IHttpClient } from "sfx.http";
import { IUpdateService } from "sfx.update";

import * as semver from "semver";
import { app, dialog } from "electron";
import * as tmp from "tmp";
import * as path from "path";
import * as url from "url";
import * as fs from "fs";
import * as http from "http";

import * as utils from "../utilities/utils";
import { env, Architecture } from "../utilities/env";
import * as appUtils from "../utilities/appUtils";

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
            throw new Error("log must be supplied.");
        }

        if (!Object.isObject(updateSettings)) {
            throw new Error("updateSettings must be supplied.");
        }

        if (!Object.isObject(httpClient)) {
            throw new Error("httpClient must be supplied.");
        }

        this.log = log;
        this.settings = updateSettings;
        this.httpClient = httpClient;
    }

    public async updateAsync(): Promise<void> {
        const versionInfo = await this.requestVersionInfoAsync();

        if (semver.gte(app.getVersion(), versionInfo.version)) {
            this.log.writeInfo("No update needed: version => current: {} remote: {}", app.getVersion(), versionInfo.version);
            return;
        }

        const packageInfo: IPackageInfo | string = versionInfo[env.platform];
        let packageUrl: string;

        if (!packageInfo) {
            this.log.writeError("No package info found for platform: {}.", env.platform);
            return;
        }

        if (String.isString(packageInfo)) {
            packageUrl = packageInfo;

            await this.requestConfirmationAsync(versionInfo)
                .then((toUpdate) => {
                    if (!toUpdate) {
                        return;
                    }

                    this.log.writeVerbose("Applying the update package and quit the app: {}", path);
                    env.start(url.parse(packageUrl).href);
                    app.quit();
                });
        } else {
            packageUrl = this.getPackagePath(packageInfo);

            await this.requestPackageAsync(packageUrl)
                .then((packagePath) => {
                    return this.requestConfirmationAsync(versionInfo)
                        .then((toUpdate) => {
                            if (!toUpdate) {
                                if (fs.existsSync(packagePath)) {
                                    fs.unlinkSync(packagePath);
                                    this.log.writeVerbose("Removed the local update package: {}", packagePath);
                                }

                                return;
                            }

                            this.log.writeVerbose("Applying the update package and quit the app: {}", packagePath);
                            env.start(packagePath);
                            app.quit();
                        });
                });
        }
    }

    public async requestVersionInfoAsync(): Promise<IVersionInfo> {
        const prereleases = semver.prerelease(app.getVersion());
        let updateChannel: string;

        if (!utils.isNullOrUndefined(prereleases) && prereleases.length > 0) {
            updateChannel = prereleases[0];
        } else {
            updateChannel = this.settings.defaultChannel || "stable";
        }

        const versionInfoUrl = `${this.settings.baseUrl}/${updateChannel}/${env.platform}`;

        this.log.writeInfo("Requesting version info json: {}", versionInfoUrl);
        const response = await this.httpClient.getAsync(versionInfoUrl);

        if (response instanceof http.IncomingMessage) {
            throw new Error(`Failed to retrieve version info. Response: ${response}`);
        }

        return response;
    }

    private requestConfirmationAsync(versionInfo: IVersionInfo): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const buttons = ["Yes", "No"];

            this.log.writeVerbose("Requesting update confirmation from the user ...");
            dialog.showMessageBox(
                {
                    message: `A newer version, ${versionInfo.version}, is found. Would you like to update now?`,
                    detail: versionInfo.description ? versionInfo.description : undefined,
                    buttons: buttons,
                    defaultId: 1
                },
                (response) => {
                    this.log.writeInfo("Update confirmation result: {} ({})", buttons[response], response);
                    resolve(response === 0);
                });
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

    private async requestPackageAsync(packagePath: string): Promise<string> {
        const tempFile: { name: string; fd: number } =
            tmp.fileSync({ keep: true, postfix: path.extname(packagePath) });
        this.log.writeInfo("Created temp file for the update package: {}", tempFile.name);

        this.log.writeInfo("Requesting the update package: {}", packagePath);
        return this.httpClient.getAsync(packagePath)
            .then((response: http.IncomingMessage) => {
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    this.log.writeVerbose("Writing update package to file: {}", tempFile.name);
                    const fileStream = fs.createWriteStream(
                        null,
                        {
                            fd: tempFile.fd,
                            autoClose: true
                        });

                    return new Promise<string>((resolve, reject) => {
                        response.pipe(fileStream)
                            .on("error", (error) => reject(error))
                            .on("finish", () => {
                                fileStream.end();
                                resolve(tempFile.name);
                            });
                    });
                }

                return Promise.reject(new Error(`Downloading update package failed. HTTP ${response.statusCode}: ${response.statusMessage}`));
            });
    }
}

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "update",
        version: appUtils.getAppVersion(),
        components: [
            {
                name: "update",
                version: appUtils.getAppVersion(),
                singleton: true,
                descriptor: (log: ILog, settings: ISettings, httpsClient: IHttpClient) => new UpdateService(log, settings.get("update"), httpsClient),
                deps: ["logging", "settings", "http.https-client"]
            }
        ]
    };
}
