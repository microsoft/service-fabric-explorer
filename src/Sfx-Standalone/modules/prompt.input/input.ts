//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IInputPromptOptions } from "sfx.prompt.input";

import * as $ from "jquery";

(async () => {
    const promptContext = await sfxModuleManager.getComponentAsync("prompt.prompt-context");
    const inputOptions: IInputPromptOptions = promptContext.promptOptions.data;
    const $input = $("#input");

    $("#title").text(inputOptions.title);
    $("#message").text(inputOptions.message);

    if (inputOptions.password) {
        $input.attr("type", "password");
    }
    
    $input.keyup(($event) => {
        const keyboardEvent = <KeyboardEvent>$event.originalEvent;
    
        if (keyboardEvent.code === "Enter") {
            $("#btn-ok").click();
        }
    });
    
    $("#btn-ok").click(() => {
        promptContext.finish($("#input").val());
    });
    
    $("#btn-cancel").click(() => promptContext.finish(null));
    
    $(document).ready(() => {
        $input.focus();
    });
})();
