//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import * as electron from "electron";
import { WebviewTag } from "electron";
import { IDialogService, IDialogRenderingOption } from "sfx.main-window";

// DialogService runs in main window
export class DialogService implements IDialogService {
    public onClose: () => Promise<void>;
    public onPost: (data: any) => Promise<void>;

    public static getComponentInfo(): Donuts.Modularity.IComponentInfo<DialogService> {
        return {
            name: "dialog-service",
            version: electron.app.getVersion(),
            singleton: true,
            descriptor: async () => new DialogService()
        };
    }

    async showDialogAsync(pageUrl: string): Promise<void> {
        const template = `
            <div id="main-modal-dialog" class="modal" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <webview src="${pageUrl}" preload="./preload.js" nodeintegration style="width=480px;"></webview>
                    </div>
                </div>
            </div>`;

        $(document.body).append($(template));

        let webview = <WebviewTag>document.querySelector(`#main-modal-dialog webview`);

        webview.addEventListener("close", async () => {
            $("#main-modal-dialog").modal("hide").remove();
        });

        $("#main-modal-dialog").modal();
    }

    async showInlineDialogAsync(options: IDialogRenderingOption): Promise<void> {
        if (!options.width) {
            options.width = 600;
        }

        if (!options.height) {
            options.height = 600;
        }
        
        if (!options.footerHtml && options.footerButtons) {
            let $footerButtons: JQLite = $("<div></div>");
            options.footerButtons.forEach(option => {
                let $button = $(`<button type="${option.type}" class="${option.cssClass}">${option.text}</button>`);
                if (option.id) {
                    $button.attr("id", option.id);
                }

                if (option.attributes) {
                    for (let key in option.attributes) {
                        $button.attr(key, option.attributes[key]);
                    }
                }

                $footerButtons.append($button);
            });

            options.footerHtml = $footerButtons.html();
        }

        const template = `                       
                <div class="modal-header">
                    <h4 class="modal-title">${options.title}</h4>
                </div>
                <div class="modal-body">
                    ${options.bodyHtml}
                </div>
                <div class="modal-footer">
                    ${options.footerHtml}
                </div>`.replace(/(?:\r\n|\r|\n)/g, "");

        $(".modal-content").html(template);
        $("#main-modal-dialog").modal();

        $(".modal-body input[type='text']").keyup(($event) => {
            const keyboardEvent = <KeyboardEvent>$event.originalEvent;

            if (keyboardEvent.code === "Enter") {
                $("button[type='submit']", $($event.target).parents(".modal-dialog")).first().click();
            }
        });

        $(".modal-footer button[type='button']").last().click(() => {
            $("#main-modal-dialog").modal("hide");
        });
        
        return Promise.resolve();
    }

    async closeInlineDialogAsync(): Promise<void> {
        $("#main-modal-dialog").modal("hide").remove();
        return Promise.resolve();
    }

    async showInlineDialogAsync2(options: IDialogRenderingOption): Promise<void> {
        if (!options.width) {
            options.width = 600;
        }

        if (!options.height) {
            options.height = 600;
        }
        
        if (!options.footerHtml && options.footerButtons) {
            let $footerButtons: JQLite = $("<div></div>");
            options.footerButtons.forEach(option => {
                let $button = $(`<button type="${option.type}" class="${option.cssClass}">${option.text}</button>`);
                if (option.id) {
                    $button.attr("id", option.id);
                }

                if (option.attributes) {
                    for (let key in option.attributes) {
                        $button.attr(key, option.attributes[key]);
                    }
                }

                $footerButtons.append($button);
            });

            options.footerHtml = $footerButtons.html();
        }

        const template = `                       
                <div class="modal-header">
                    <h4 class="modal-title">${options.title}</h4>
                </div>
                <div class="modal-body">
                    ${options.bodyHtml}
                </div>
                <div class="modal-footer">
                    ${options.footerHtml}
                </div>`.replace(/(?:\r\n|\r|\n)/g, "");

        $(".modal-content").html(template);
        $("#main-modal-dialog").modal();

        $(".modal-body input[type='text']").keyup(($event) => {
            const keyboardEvent = <KeyboardEvent>$event.originalEvent;

            if (keyboardEvent.code === "Enter") {
                $("button[type='submit']", $($event.target).parents(".modal-dialog")).first().click();
            }
        });

        $(".modal-footer button[type='button']").last().click(() => {
            $("#main-modal-dialog").modal("hide");
        });
        
        return Promise.resolve();
    }
}
