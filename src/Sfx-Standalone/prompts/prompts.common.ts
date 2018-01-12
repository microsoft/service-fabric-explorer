//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { BrowserWindow, LoadURLOptions, Menu } from "electron";

export interface IPromptOptions {
    pageUrl: string;
    loadUrlOptions?: LoadURLOptions;
    frame?: boolean;
    showMenu?: boolean;
    menu?: Menu;
    data?: any;
    width?: number;
    height?: number;
    resizable?: boolean;
    icon?: string;
    parentWindow?: BrowserWindow;
    minimizable?: boolean;
    closable?: boolean;
}

export enum EventNames {
    RequestPromptOptions = "request-prompt-options",
    Finished = "finished"
}

export const CommunicatorChannelName = "prompt";
