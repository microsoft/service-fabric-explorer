import { remote } from "electron";
import * as $ from "jquery";
import * as Url from "url";

import { PromptContext } from "../prompts.context";

$("#input-cluster-url").keyup(($event) => {
    let keyboardEvent = <KeyboardEvent>$event.originalEvent;

    if (keyboardEvent.code === "Enter") {
        $("#btn-connect").click();
    }
});

$("#input-connect-locally").change(($event) => {
    let $sender = $($event.target);
    if ($sender.prop("checked")) {
        $("#input-cluster-url").val("http://localhost:19080");
    }

    $("#input-cluster-url").prop("disabled", $sender.prop("checked"));
});

$("#btn-connect").click(() => {
    try {
        let url = Url.parse($("#input-cluster-url").val().toString());

        if (url.protocol !== "http:" && url.protocol !== "https:") {
            remote.dialog.showErrorBox("Invalid cluster url", "The protocol of the cluster url is not supported. Only HTTP and HTTPS are supported.");
            return;
        }

        PromptContext.getInstance().finish(url.protocol + "//" + url.host);
    } catch (error) {
        remote.dialog.showErrorBox("Invalid cluster url", "The cluster url is not in a valid url format.");
    }
});

$("#btn-exit").click(() => PromptContext.getInstance().close());
