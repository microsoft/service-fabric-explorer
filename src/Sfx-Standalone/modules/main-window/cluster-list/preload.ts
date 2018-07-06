//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import bootstrapPromise from "../../../module-manager/bootstrap";

global["exports"] = exports;

process.once("loaded", async () => {
    await bootstrapPromise;
});
