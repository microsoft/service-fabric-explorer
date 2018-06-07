//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.prompt" {
    import { ICommunicator } from "sfx.ipc";
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

    export interface IPromptContext {
        readonly promptOptions: IPromptOptions;
    
        finish<TPromptResults>(results: TPromptResults): void;
        close(): void;
    }
}

declare module "sfx" {
    import { Certificate } from "electron";
    import { ICommunicator } from "sfx.ipc";
    import {
        IPromptService,
        IPromptContext,
        IInputPromptOptions, 
        ISelectCertificatePromptResults
    } from "sfx.prompt";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "prompt-service"): Promise<IPromptService>;

        getComponentAsync(componentIdentity: "prompt-context"):  Promise<IPromptContext>;

        getComponentAsync(componentIdentity: "prompt-input",
            parentWindowId: number,
            options: IInputPromptOptions,
            promptCallback: (error: any, input: string) => void):  Promise<ICommunicator>;

        getComponentAsync(componentIdentity: "prompt-connect-cluster",
            promptCallback: (error: any, targetClusterUrl: string) => void):  Promise<ICommunicator>;

        getComponentAsync(componentIdentity: "prompt-select-certificate",
            parentWindowId: number,
            certificates: Array<Certificate>,
            promptCallback: (error: any, results: ISelectCertificatePromptResults) => void):  Promise<ICommunicator>;
    }
}
