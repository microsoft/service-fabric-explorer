//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as url from "url";
import * as path from "path";

import * as utils from "./utils";
import { electron } from "./electron-adapter";

export interface IPathObject {
    path: string;
    hash?: string;
    query?: string | any;
    search?: string;
}

const appDir: string = electron.app.getAppPath();

export default function resolve(
    pathObject: string | IPathObject,
    fromAppDir: boolean = false): string {
    let urlObject: url.UrlObject = {
        protocol: "file:",
        slashes: true
    };

    if (String.isString(pathObject)) {
        urlObject.pathname = local(pathObject, fromAppDir);
    } else {
        urlObject.pathname = local(pathObject.path, fromAppDir);

        if (pathObject.hash) {
            urlObject.hash = pathObject.hash;
        }

        if (pathObject.query) {
            urlObject.query = pathObject.query;
        }

        if (pathObject.search) {
            urlObject.search = pathObject.search;
        }
    }

    return url.format(urlObject);
}

export function local(target: string, fromAppDir: boolean = false): string {
    return path.join(fromAppDir ? appDir : path.dirname(utils.getCallerInfo().fileName), target);
}
