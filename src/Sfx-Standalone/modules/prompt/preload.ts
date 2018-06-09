//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import "../browser-window/preload";

import { PromptContext } from "./prompt-context";
import { electron } from "../../utilities/electron-adapter";

sfxModuleManager.registerComponents([
    {
        name: "prompt.prompt-context",
        version: electron.app.getVersion(),
        singleton: true,
        descriptor: () => new PromptContext()
    }
]);
