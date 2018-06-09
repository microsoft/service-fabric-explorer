//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { execSync } from "child_process";

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

class Environment implements IEnvironment {
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

    public start(path: string) {
        const escape = (str: string) => {
            return str.replace(/"/g, '\\\"');
        };

        let cmd: string = "";

        if (!path) {
            throw new Error("path must be specified!");
        }

        switch (this.platform) {
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

        execSync(cmd + ' "' + escape(path) + '"');
    }
}

export interface IEnvironment {
    readonly arch;
    
    readonly platform;

    start(path: string): void;
}

export const env: IEnvironment = new Environment();
