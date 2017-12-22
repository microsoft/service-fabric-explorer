import { remote } from "electron";
import * as $ from "jquery";
import * as Url from "url";

import { PromptContext } from "../prompts.context";

let inputOptions: IInputPromptOptions = PromptContext.getInstance().promptOptions.data;
let $input = $("#input");

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
    PromptContext.getInstance().finish($("#input").val());
});

$("#btn-cancel").click(() => PromptContext.getInstance().close());

$(document).ready(() => {
    $input.focus();
});
