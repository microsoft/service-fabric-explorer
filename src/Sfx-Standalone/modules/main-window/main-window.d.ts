//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.main-window" {
    import "jquery";

    export interface IMainWindow {
        register(navComponent: ISfxVueComponent): void;    
        loadComponents(): void;
    }

    export interface ISfxVueComponent {
        path: string;
        render(container: JQuery): void;        
    }

    export interface ISfxVueComponentRedneringOption {
        position: string;
        order: number;
    }
}

declare module "sfx.module-manager" {    
    import { IMainWindow } from "sfx.main-window";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "main-window"): Promise<IMainWindow>;
    }
}

