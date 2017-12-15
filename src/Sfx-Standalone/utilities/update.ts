import { IncomingMessage } from "http";
import * as https from "https";
import * as util from "util";
import * as semver from "semver";
import { app, dialog } from "electron";
import * as tmp from "tmp";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";

import { Platform, Architecture } from "./env";
import error from "./errorUtil";
import env from "../utilities/env";
import settings from "./settings";
import { logWarning, logVerbose, logInfo, logError } from "./log";

function handleRedirection(response: IncomingMessage): string {
    switch (response.statusCode) {
        case 301: // Moved Permanently
        case 302: // Found
        case 307: // Temporary Redirect
        case 308: // Permanent Redirect
            return response.headers["location"];

        default:
            return null;
    }
}

function requestVersionInfo(callback: (error: Error, versionInfo: IVersionInfo) => void): void {
    if (!util.isFunction(callback)) {
        throw error("callback must be a function.");
    }

    const channel = semver.prerelease(app.getVersion());
    const versionInfoBaseUrl = settings.default.get("update/baseUrl");

    let versionInfoUrl = util.format("%s/%s/%s", versionInfoBaseUrl, channel, env.platform);

    let handleResponse = (response: IncomingMessage): void => {
        let redirectionUrlString = handleRedirection(response);

        if (redirectionUrlString) {
            let redirectionUrl = url.parse(redirectionUrlString);

            if (redirectionUrl.protocol !== "https:") {
                logError("The versioninfo.json redirection url is not with HTTPS protocol. Redirection abandoned. Redirection url: %s", redirectionUrlString);
            } else {
                logInfo("Retrieving versioninfo.json with redirection url: %s", redirectionUrlString);
                https.get(redirectionUrl, handleResponse)
                    .on("error", (error) => {
                        logError("Failed to retrieve versioninfo.json with redirection url: %s", redirectionUrlString);
                        callback(error, null);
                    });
            }
        } else if (response.statusCode === 200) {
            let versionInfoJson = "";

            response.on("data", (chunk) => versionInfoJson += chunk);
            response.on("end", () => {
                try {
                    let versionInfo = <IVersionInfo>JSON.parse(versionInfoJson);

                    logInfo("Succeeded retrieving versioninfo.json => version = %s.", versionInfo.version);
                    callback(null, versionInfo);
                } catch (error) {
                    logError("Failed to parse versioninfo.json: ", error);
                    callback(error, null);
                }
            });
        } else {
            logError("Unexpected response: \nHTTP %s %s\n%s", response.statusCode, response.statusMessage, response.rawHeaders.join("\n"));
        }
    };

    logInfo("Retrieving version.json: %s", versionInfoUrl);
    https.get(versionInfoUrl, handleResponse)
        .on("error", (error) => {
            logError("Failed to retrieve versioninfo.json: %s \r\n Error: %s", versionInfoUrl, error);
            callback(error, null);
        });
}

function startUpdate(versionInfo: IVersionInfo, failureCallback?: (error: Error) => void): void {
    const callFailureCallback = (error: Error): void => {
        if (util.isFunction(failureCallback)) {
            failureCallback(error);
        }
    };

    let packageInfo: IPackageInfo = versionInfo[env.platform];

    if (!packageInfo) {
        logError("No package info found for platform: %s.", env.platform);
        callFailureCallback(error("No package info found for platform: %s.", env.platform));
        return;
    }

    let packagePath = packageInfo[env.arch];

    if (!packagePath) {
        logInfo("Fall back to x86 for platform %s. (current arch: %s)", env.platform, env.arch);
        // fall back to x86 if the current one doesn't exist.
        packagePath = packageInfo[Architecture.X86];
    }

    if (!packagePath) {
        logError("Architecture %s is NOT found in %s package info.", env.arch, env.platform);
        callFailureCallback(error("Architecture %s is NOT found in %s package info.", env.arch, env.platform));
        return;
    }

    logInfo("Retrieving the update package: %s", packagePath);
    https.get(packagePath,
        (response) => {
            if (response.statusCode !== 200) {
                logError("Failed to retrieve update package (HTTP: %d): %s", response.statusCode, packagePath);
                callFailureCallback(error("Failed to retrieve update package (HTTP: %d): %s", response.statusCode, packagePath));
                return;
            }

            tmp.file(
                {
                    keep: true,
                    postfix: path.extname(packagePath)
                },
                (err, path: string, fd: number, cleanupCallback: () => void) => {
                    let tmpStream = fs.createWriteStream(null, { fd: fd });

                    logInfo("Saving the update package to local temp file: %s", path);
                    response.pipe(tmpStream)
                        .on("finish", () => {
                            tmpStream.end();

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
                                            cleanupCallback();
                                            logInfo("Removed the local update package.");
                                            break;
                                    }
                                });

                        });
                });
        })
        .on("error", (error) => {
            logError("Failed to retrieve the update package: %s \r\n Error: %s", packagePath, error);
            callFailureCallback(error);
        });
}

function checkUpdate(callback: (updateAvailable: boolean, versionInfo: IVersionInfo) => void): void {
    if (!util.isFunction(callback)) {
        throw error("callback must be a function.");
    }

    requestVersionInfo((error, versionInfo) => {
        let updateAvailable = !util.isNullOrUndefined(error) ? false : semver.lt(app.getVersion(), versionInfo.version);

        if (util.isNullOrUndefined(error)) {
            updateAvailable = semver.lt(app.getVersion(), versionInfo.version);
            logInfo("Checking update: updateAvailable: %s => currentVersion: %s, versionInfo.version: %s", updateAvailable, app.getVersion(), versionInfo.version);
        } else {
            updateAvailable = false;
            logInfo("Checking update: updateAvailable: false => error: ", error);
        }

        callback(updateAvailable, versionInfo);
    });
}

export function checkAndUpdate() {
    checkUpdate((updateAvailable, versionInfo) => {
        if (updateAvailable) {
            startUpdate(versionInfo);
        }
    });
}
