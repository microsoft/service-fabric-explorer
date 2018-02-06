//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IPromptOptions } from "./prompt";

export interface IPromptContext {
    readonly promptOptions: IPromptOptions;

    finish<TPromptResults>(results: TPromptResults): void;
    close(): void;
}

declare global {
    const moduleManager: IModuleManager;

    interface IModuleManager {
        getComponent(componentIdentity: "prompt-context"): IPromptContext;
    }
}
