import { BrowserWindow } from "electron";
import * as Url from "url";

import resolve from "../../utilities/resolve";

export function handle(window: BrowserWindow) {
    window.webContents.on("did-get-redirect-request", (event, oldUrlString, newUrlString, isMainFrame, httpResponseCode, requestMethod, referrer, headers) => {
        let newUrl = Url.parse(newUrlString);
        let targetClusterUrl = Url.parse(global["TargetClusterUrl"]);

        if (newUrl.hostname.toUpperCase() === targetClusterUrl.hostname.toUpperCase()) {
            window.loadURL(resolve({ path: "sfx/index.html", hash: newUrl.hash }, true));
        }
    });
}
