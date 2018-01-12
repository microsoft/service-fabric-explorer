//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { execSync } from "child_process";
import * as uuidv4 from "uuid/v4";
import * as util from "util";

import { local } from "./resolve";
import error from "./errorUtil";
import settings from "./settings";

export enum Architecture {
    Unknown = "unknown",
    X86 = "x86",
    X64 = "x64",
    Arm = "arm"
}

export enum Platform {
    Windows = "windows",
    Linux = "linux",
    MacOs = "macos",
    Unknown = "unknown"
}

class Environment {
    public readonly appInstanceId: string;

    constructor() {
        this.appInstanceId = settings.default.get("appInstanceId");

        if (util.isNullOrUndefined(this.appInstanceId)) {
            this.appInstanceId = uuidv4();
            settings.default.set("appInstanceId", this.appInstanceId);
        }
    }

    public get platform(): Platform {
        switch (process.platform) {
            case "win32":
                return Platform.Windows;

            case "linux":
                return Platform.Linux;

            case "darwin":
                return Platform.MacOs;

            default:
                return Platform.Unknown;
        }
    }

    public get arch(): Architecture {
        switch (process.arch) {
            case "ia32":
                return Architecture.X86;

            case "x64":
                return Architecture.X64;

            case "arm":
                return Architecture.Arm;

            default:
                return Architecture.Unknown;
        }
    }

    public startFile(filePath: string) {
        const escape = (str: string) => {
            return str.replace(/"/g, '\\\"');
        };

        let cmd: string = "";

        if (!filePath) {
            throw error("filePath must be specified!");
        }

        switch (environment.platform) {
            case Platform.Windows:
                cmd = "start \"sfx-standalone-upgrade\"";
                break;

            case Platform.MacOs:
                cmd = "open";
                break;

            case Platform.Linux:
            default:
                cmd = "xdg-open";
                break;
        }

        execSync(cmd + ' "' + escape(filePath) + '"');
    }

    public getIconPath(): string {
        switch (environment.platform) {
            case Platform.Windows:
                return local("../icons/icon.ico");

            case Platform.MacOs:
                return local("../icons/icon.icns");

            case Platform.Linux:
            default:
                return local("../icons/icon128x128.png");
        }
    }
}

const environment = new Environment();

export default environment;
