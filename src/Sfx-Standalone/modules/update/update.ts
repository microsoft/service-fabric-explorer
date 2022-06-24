//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IVersionInfo, IPackageInfo } from "sfx.common";
import { IHttpClient } from "sfx.http";
import { IUpdateService } from "sfx.update";

import * as semver from "semver";
import { app, dialog } from "electron";
import * as tmp from "tmp";
import * as path from "path";
import * as url from "url";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";

import * as utils from "donuts.node/utils";
import * as shell from "donuts.node/shell";

export interface IUpdateSettings {
    baseUrl: string;
    defaultChannel: string;
}

const Platform: Donuts.IStringKeyDictionary<string> = {
    "win32": "windows",
    "darwin": "macos",
    "linux": "linux"
};

const Architecture: Donuts.IStringKeyDictionary<string> = {
    "ia32": "x86",
    "x64": "x64",
    "arm": "arm"
};

export default class UpdateService implements IUpdateService {
    private readonly log: Donuts.Logging.ILog;

    private readonly settings: IUpdateSettings;

    private readonly httpClient: IHttpClient;

    constructor(log: Donuts.Logging.ILog, updateSettings: IUpdateSettings, httpClient: IHttpClient) {
        if (!utils.isObject(log)) {
            throw new Error("log must be supplied.");
        }

        if (!utils.isObject(updateSettings)) {
            throw new Error("updateSettings must be supplied.");
        }

        if (!utils.isObject(httpClient)) {
            throw new Error("httpClient must be supplied.");
        }

        this.log = log;
        this.settings = updateSettings;
        this.httpClient = httpClient;
    }

    public async updateAsync(): Promise<void> {
        const versionInfo = await this.requestVersionInfoAsync();

        if (semver.gte(app.getVersion(), versionInfo.version)) {
            this.log.writeInfoAsync("No update needed: version => current: {} remote: {}", app.getVersion(), versionInfo.version);
            return;
        }

        const packageInfo: IPackageInfo | string = versionInfo[Platform[process.platform]];
        let packageUrl: string;

        if (!packageInfo) {
            this.log.writeErrorAsync("No package info found for platform: {}.", Platform[process.platform]);
            return;
        }

        if (utils.isString(packageInfo)) {
            packageUrl = packageInfo;

            await this.requestConfirmationAsync(versionInfo)
                .then((toUpdate) => {
                    if (!toUpdate) {
                        return;
                    }

                    this.log.writeVerboseAsync("Applying the update package and quit the app: {}", path);
                    shell.start(url.parse(packageUrl).href);
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
                                    this.log.writeVerboseAsync("Removed the local update package: {}", packagePath);
                                }

                                return;
                            }

                            this.log.writeVerboseAsync("Applying the update package and quit the app: {}", packagePath);
                            shell.start(packagePath);
                            app.quit();
                        });
                });
        }
    }

    public requestVersionInfoAsync(): Promise<IVersionInfo> {
        const prereleases = semver.prerelease(app.getVersion());
        let updateChannel: string;

        if (!utils.isNullOrUndefined(prereleases) && prereleases.length > 0) {
            updateChannel = prereleases[0];
        } else {
            updateChannel = this.settings.defaultChannel || "stable";
        }

        const versionInfoUrl = `${this.settings.baseUrl}/${updateChannel}/${Platform[process.platform]}`;

        this.log.writeInfoAsync(`Requesting version info json: ${versionInfoUrl}`);

        return this.httpClient.getAsync(versionInfoUrl);
    }

    private requestConfirmationAsync(versionInfo: IVersionInfo): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const buttons = ["Yes", "No"];

            this.log.writeVerboseAsync("Requesting update confirmation from the user ...");
            dialog.showMessageBox(
                {
                    message: `A newer version, ${versionInfo.version}, is found. Would you like to update now?`,
                    detail: versionInfo.description ? versionInfo.description : undefined,
                    buttons: buttons,
                    defaultId: 1
                },
                (response) => {
                    this.log.writeInfoAsync("Update confirmation result: {} ({})", buttons[response], response);
                    resolve(response === 0);
                });
        });
    }

    private getPackagePath(packageInfo: IPackageInfo): string {
        let packagePath = packageInfo[Architecture[process.arch]];

        if (!packagePath) {
            // fall back to x86 if the current one doesn't exist.
            packagePath = packageInfo[Architecture["x86"]];
            this.log.writeVerboseAsync("Fall back to x86 for platform {} from arch {}.", Platform[process.platform], Architecture[process.arch]);
        }

        if (!packagePath) {
            this.log.writeErrorAsync("Arch {1} is NOT found in {0} package info.", Platform[process.platform], Architecture[process.arch]);
            return null;
        }

        return packagePath;
    }

    private async requestPackageAsync(packagePath: string): Promise<string> {
        this.log.writeInfoAsync("Requesting the update package: {}", packagePath);

        return new Promise<string>((resolve, reject) => {
            const saveResponseToFile = (response: http.IncomingMessage) => {
                if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
                    packagePath = response.headers.location;

                    if (url.parse(packagePath).protocol === "https:") {
                        https.get(packagePath, saveResponseToFile);
                    } else {
                        http.get(packagePath, saveResponseToFile);
                    }

                    return;
                }

                if (response.statusCode >= 300) {
                    reject(new Error(`Downloading update package failed. HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }

                const fileNameMatches = /filename\=([^\\/\:\*\?\"\<\>\|]+)\;?/i.exec(response.headers["content-disposition"]);
                let fileName: string = url.parse(packagePath).pathname;

                if (fileNameMatches) {
                    fileName = fileNameMatches[1];
                }

                const tempFile: { name: string; fd: number } =
                    tmp.fileSync({ keep: true, postfix: path.extname(fileName) });
                this.log.writeInfoAsync("Created temp file for the update package: {}", tempFile.name);

                response.pipe(fs.createWriteStream(null, { fd: tempFile.fd }));
                response.on("end", () => resolve(tempFile.name));
            };

            if (url.parse(packagePath).protocol === "https:") {
                https.get(packagePath, saveResponseToFile);
            } else {
                http.get(packagePath, saveResponseToFile);
            }
        });
    }
}
