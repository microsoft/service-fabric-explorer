//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

//import { bootstrap } from "../../bootstrap.module-manager";

process.once("loaded", async () => {
    global["exports"] = exports;
    //global["sfx"] = await bootstrap();
});
