//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";

$(document).ready(() => {
    $(".modal").slideDown(100);
});

(async () => {
    $("button[dialog-role='close']").click(() => {
        window.close();
    });
})();

export function appendDialogContent(content: string) {
    $(".modal-content").html(content);
}
