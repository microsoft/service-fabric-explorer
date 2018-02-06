//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { remote } from "electron";
import * as $ from "jquery";
import * as Url from "url";

import {} from "../../@types/prompt-window";
import { IInputPromptOptions } from "../../@types/prompt";

const promptContext = moduleManager.getComponent("prompt-context");
const inputOptions: IInputPromptOptions = promptContext.promptOptions.data;
const $input = $("#input");

$("#title").text(inputOptions.title);
$("#message").text(inputOptions.message);

if (inputOptions.password) {
    $input.attr("type", "password");
}

$input.keyup(($event) => {
    let keyboardEvent = <KeyboardEvent>$event.originalEvent;

    if (keyboardEvent.code === "Enter") {
        $("#btn-ok").click();
    }
});

$("#btn-ok").click(() => {
    promptContext.finish($("#input").val());
});

$("#btn-cancel").click(() => promptContext.close());

$(document).ready(() => {
    $input.focus();
});
