//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import "../../module-manager/bootstrap";

process.once("loaded", async () => {
    // TODO: Remove global.exports when the node v10 is integrated with electron.
    global["exports"] = exports;
});
