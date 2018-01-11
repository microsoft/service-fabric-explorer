import { BrowserWindow } from "electron";
import * as querystring from "querystring";
import * as Url from "url";

import resolve from "../../utilities/resolve";

export function handle(window: BrowserWindow) {
    window.webContents.on("did-get-redirect-request", (event, oldUrlString, newUrlString, isMainFrame, httpResponseCode, requestMethod, referrer, headers) => {
        let newUrl = Url.parse(newUrlString);
        let targetClusterUrl = Url.parse(global["TargetClusterUrl"]);

        if (newUrl.hostname.toUpperCase() === targetClusterUrl.hostname.toUpperCase()) {
            if (isMainFrame) {
                window.loadURL(resolve({ path: "sfx/index.html", hash: newUrl.hash }, true));
            } else {
                /* This is for handling token renew in adal.js and needs to tested everytime adal.js is updated/changed.
                
                   adal.js only handles the auth requests issued by itself via persisting the state property in memory for renewing tokens via iframe.

                   As iframe in electron v1.7.9 cannot be forced to redirect to the local resource, the whole page needs to be refreshed for injecting the renewed token.
                   But refreshing the page makes the adal.js lose all the in-memory renew states. Therefore, using the "adal.state.login" item in localStorage
                   to make adal.js treat renew as login.
                */
                let querystrings = querystring.parse(newUrl.hash);
                window.webContents.executeJavaScript("window.localStorage.setItem('adal.state.login', '" + querystrings["state"] + "')")
                    .then(() => window.loadURL(resolve({ path: "sfx/index.html", hash: newUrl.hash }, true)));
            }
        }
    });
}
