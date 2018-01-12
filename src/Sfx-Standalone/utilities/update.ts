//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as util from "util";
import * as semver from "semver";
import { app, dialog } from "electron";
import * as tmp from "tmp";
import * as path from "path";
import * as url from "url";
import * as fs from "fs";

import { Architecture } from "./env";
import env from "../utilities/env";
import settings from "./settings";
import { logWarning, logVerbose, logInfo, logError } from "./log";
import * as httpsClient from "./httpsClient";

function requestVersionInfo(callback: (versionInfo: IVersionInfo) => void): void {
    const prereleases = semver.prerelease(app.getVersion());
    let updateChannel: string;

    if (!util.isNullOrUndefined(prereleases) && prereleases.length > 0) {
        updateChannel = prereleases[0];
    } else {
        updateChannel = settings.default.get("update/defaultChannel") || "stable";
    }

    const baseUrl = settings.default.get("update/baseUrl");
    const versionInfoUrl =
        util.format(
            "%s/%s/%s",
            baseUrl,       // Update Base Url
            updateChannel, // Channel
            env.platform); // Platform

    logInfo("Retrieving version.json: %s", versionInfoUrl);
    httpsClient.get(
        versionInfoUrl,
        httpsClient.createJsonResponseHandler<IVersionInfo>((error, versionInfo) => {
            if (error) {
                logError("Failed to request versioninfo.json: %s \r\n Error: %s", versionInfoUrl, error);
                return;
            }

            callback(versionInfo);
        }));
}

function confirmUpate(versionInfo: IVersionInfo, path: string): void {
    let buttons = ["Yes", "No"];

    dialog.showMessageBox(
        {
            message: util.format("A newer version, %s, is found. Would you like to update now?", versionInfo.version),
            detail: versionInfo.description ? versionInfo.description : undefined,
            buttons: buttons,
            defaultId: 1
        },
        (response) => {
            logInfo("The user response whether to apply the update: %s (%d)", buttons[response], response);
            switch (response) {
                case 0: // Yes
                    logInfo("Applying the update package and quit the app.");
                    env.startFile(path);
                    app.quit();
                    break;

                case 1: // No
                default:
                    if (fs.existsSync(path)) {
                        fs.unlinkSync(path);
                        logInfo("Removed the local update package.");
                    }
                    break;
            }
        });
}

function isUpdateAvailable(versionInfo: IVersionInfo): boolean {
    let updateAvailable = semver.lt(app.getVersion(), versionInfo.version);

    updateAvailable = semver.lt(app.getVersion(), versionInfo.version);
    logInfo("Checking update: updateAvailable: %s => currentVersion: %s, versionInfo.version: %s", updateAvailable, app.getVersion(), versionInfo.version);

    return updateAvailable;
}

function getPackagePath(packageInfo: IPackageInfo): string {
    let packagePath = packageInfo[env.arch];

    if (!packagePath) {
        logInfo("Fall back to x86 for platform %s. (current arch: %s)", env.platform, env.arch);
        // fall back to x86 if the current one doesn't exist.
        packagePath = packageInfo[Architecture.X86];
    }

    if (!packagePath) {
        logError("Architecture %s is NOT found in %s package info.", env.arch, env.platform);
        return null;
    }

    return packagePath;
}

function requestPackage(packagePath: string, callback: (filePath: string) => void): void {
    let tempFile: { name: string; fd: number } = tmp.fileSync({ keep: true, postfix: path.extname(packagePath) });
    logInfo("Created temp file for the update package: %s", tempFile.name);

    logInfo("Retrieving the update package: %s ...", packagePath);
    httpsClient.get(
        packagePath,
        httpsClient.createFileResponseHandler(tempFile.fd, true, (error) => callback(tempFile.name)));
}

export function start() {
    requestVersionInfo((versionInfo) => {
        if (!isUpdateAvailable(versionInfo)) {
            return;
        }

        let packageInfo: IPackageInfo | string = versionInfo[env.platform];
        let packagePath: string;

        if (!packageInfo) {
            logError("No package info found for platform: %s.", env.platform);
            return;
        }

        if (util.isString(packageInfo)) {
            packagePath = packageInfo;

            try {
                confirmUpate(versionInfo, url.parse(packagePath).href);
            } catch (error) {
                logError("Invalid packagePath: %s", packagePath);
            }
        } else {
            packagePath = getPackagePath(packageInfo);

            requestPackage(packagePath, (filePath) => confirmUpate(versionInfo, filePath));
        }
    });
}
