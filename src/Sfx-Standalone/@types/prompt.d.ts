//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { MenuItemConstructorOptions, Certificate } from "electron";

export interface IPromptOptions {
    pageUrl: string;
    frame?: boolean;
    showMenu?: boolean;
    menuTemplate?: MenuItemConstructorOptions[];
    data?: any;
    width?: number;
    height?: number;
    resizable?: boolean;
    icon?: string;
    parentWindowId?: number;
    minimizable?: boolean;
    closable?: boolean;
}

export interface IPromptService {
    open<TPromptResults>(
        promptOptions: IPromptOptions,
        promptCallback?: (error: any, results: TPromptResults) => void): ICommunicator;
}

export interface IInputPromptOptions {
    password?: boolean;
    title: string;
    message: string;
}

export interface ISelectCertificatePromptResults {
    selectedCertificate?: Certificate;
    certificatesImported?: boolean;
}

declare global {
    interface IModuleManager {
        getComponent(componentIdentity: "prompt-service"): IPromptService;

        getComponent(componentIdentity: "prompt-input",
            parentWindowId: number,
            options: IInputPromptOptions,
            promptCallback: (error: any, input: string) => void): ICommunicator;

        getComponent(componentIdentity: "prompt-connect-cluster",
            promptCallback: (error: any, targetClusterUrl: string) => void): ICommunicator;

        getComponent(componentIdentity: "prompt-select-certificate",
            parentWindowId: number,
            certificates: Array<Certificate>,
            promptCallback: (error: any, results: ISelectCertificatePromptResults) => void): ICommunicator;
    }
}
