//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
process.once("loaded", () => {
    console.log("browser-window.preload.ts: executing bootstrap.");
    require("../../module-manager/bootstrap.js");

    console.log("browser-window.preload.ts: global['sfxModuleManager']");
    console.log(global["sfxModuleManager"]);
});
