//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.prompt" {
    import { IDisposable } from "sfx.common";
    import { MenuItemConstructorOptions } from "electron";

    export interface IPromptOptions {
        pageUrl: string;
        frame?: boolean;
        showMenu?: boolean;
        menuTemplate?: Array<MenuItemConstructorOptions>;
        data?: any;
        width?: number;
        height?: number;
        resizable?: boolean;
        icon?: string;
        parentWindowId?: number;
        minimizable?: boolean;
        closable?: boolean;
    }

    export interface IPromptContext {
        readonly promptOptions: IPromptOptions;
    
        finish<TPromptResults>(results: TPromptResults): void;
    }

    export interface IPrompt<TResult> extends IDisposable {
        openAsync(): Promise<TResult>;
    }

    export interface IPromptService {
        createAsync<TResult>(promptOptions: IPromptOptions): Promise<IPrompt<TResult>>;
    }
}

declare module "sfx.module-manager" {
    import {
        IPromptService,
        IPromptContext,
    } from "sfx.prompt";

    export interface ISfxModuleManager {
        getComponentAsync(componentIdentity: "prompt.prompt-service"): Promise<IPromptService>;

        getComponentAsync(componentIdentity: "prompt.prompt-context"):  Promise<IPromptContext>;
    }
}
