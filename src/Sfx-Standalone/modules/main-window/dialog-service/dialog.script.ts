//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
// import * as Url from "url";
// import { ISfxContainer } from "sfx.sfx-view-container";

$(document).ready(() => {
    $(".modal").slideDown(100);
});


(async () => {
    $("button[dialog-role='close']").click(() => {
        window.close();
    });
})();
