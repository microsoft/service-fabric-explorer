import { app, BrowserWindow, dialog, Certificate, BrowserWindowConstructorOptions } from "electron";
import * as url from "url";
import * as uuidv5 from "uuid/v5";

import * as logging from "./utilities/log";
import openConnectClusterPrompt from "./prompts/connect-cluster/prompt";
import * as authCert from "./utilities/auth/cert";
import * as authAad from "./utilities/auth/aad";
import resolve from "./utilities/resolve";
import prompt from "./prompts/prompts";
import env from "./utilities/env";
import { checkAndUpdate } from "./utilities/update";
import { logEvent } from "./utilities/log";

function handleSslCert(window: BrowserWindow): void {
    let trustedCertManager: IDictionary<boolean> = {};

    window.webContents.on("certificate-error", (event, urlString, error, certificate, trustCertificate) => {
        event.preventDefault();

        let certIdentifier = url.parse(urlString).hostname + certificate.subjectName;

        if (certIdentifier in trustedCertManager) {
            trustCertificate(trustedCertManager[certIdentifier]);
        } else {
            trustedCertManager[certIdentifier] = false;

            dialog.showMessageBox(
                window,
                {
                    type: "warning",
                    buttons: ["Yes", "No", "Cancel"],
                    title: "Untrusted certificate",
                    message: "Do you want to trust this certificate?",
                    detail: "Subject: " + certificate.subjectName + "\r\nIssuer: " + certificate.issuerName + "\r\nThumbprint: " + certificate.fingerprint,
                    cancelId: 2
                },
                (response, checkboxChecked) => {
                    trustedCertManager[certIdentifier] = response === 0;
                    trustCertificate(response === 0);
                });
        }
    });
}

function handleNewWindow(window: BrowserWindow) {
    window.webContents.on("new-window",
        (event, urlString, frameName, disposition, options, additionalFeatures) => {
            event.preventDefault();

            env.startFile(urlString);
        });
}

function handleZoom(window: BrowserWindow) {
    let zoomLevel = 0;

    window.webContents.setZoomLevel(zoomLevel);

    window.webContents.on("before-input-event",
        (event, input) => {
            if (input.control) {
                if (input.type === "keyUp" && input.code === "Digit0") {
                    window.webContents.setZoomLevel(0);
                } else if (input.type === "keyDown") {
                    switch (input.code) {
                        case "Equal":
                            window.webContents.setZoomLevel(++zoomLevel);
                            break;
                        case "Minus":
                            window.webContents.setZoomLevel(--zoomLevel);
                            break;
                        default:
                            break;
                    }
                }
            }
        });
}

function createMainWindow() {
    let windowOptions: BrowserWindowConstructorOptions = {
        height: 768,
        width: 1024,
        show: false,
        icon: env.getIconPath()
    };

    let window = new BrowserWindow(windowOptions);

    window.setMenuBarVisibility(true);

    handleSslCert(window);
    handleNewWindow(window);
    handleZoom(window);

    authCert.handle(window);
    authAad.handle(window);

    window.on("ready-to-show", () => window.show());

    return window;
}

function mainWindowStartup() {
    openConnectClusterPrompt(
        (error, clusterUrl) => {
            if (clusterUrl) {
                global["TargetClusterUrl"] = clusterUrl;

                logEvent("connect-cluster", { "clusterId": uuidv5(clusterUrl, uuidv5.URL) });
                createMainWindow().loadURL(resolve("sfx/index.html"));
            }
        });
}

/**
 * Main function for the sfxdesktop.
 */
(function main() {
    let mainWindow: BrowserWindow = null;

    logging.initialize();

    app.commandLine.appendSwitch("incognito");

    app.setName("Service Fabric Explorer");

    app.on("ready", (launchInfo) => {
        mainWindowStartup();
        setTimeout(checkAndUpdate, 1000); // Check upgrade after 1 sec.
    });

    app.on("window-all-closed", () => {
        app.quit();
    });
})();
