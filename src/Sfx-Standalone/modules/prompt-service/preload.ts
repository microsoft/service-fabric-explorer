//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import "../browser-window/preload";
import { PromptContext } from "./prompt-context";
import { electron } from "../../utilities/electron-adapter";
import { DiDescriptorConstructor } from "../../utilities/di.ext";

const moduleManager: IModuleManager = global["moduleManager"];

moduleManager.registerComponents([
    {
        name: "prompt-context",
        version: electron.app.getVersion(),
        singleton: true,
        descriptor: () => new PromptContext()
    }
]);
