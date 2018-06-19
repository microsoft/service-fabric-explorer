//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.prompt.input" {
    export interface IInputPromptOptions {
        password?: boolean;
        title: string;
        message: string;
    }
}

declare module "sfx.module-manager" {
    import { IPrompt } from "sfx.prompt";
    import { IInputPromptOptions } from "sfx.prompt.input";

    export interface IModuleManager {
        getComponentAsync(
            componentIdentity: "prompt.input",
            parentWindowId: number,
            options: IInputPromptOptions): Promise<IPrompt<string>>;
    }
}
