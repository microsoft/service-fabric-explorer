import * as $ from "jquery";
import { } from "bootstrap";
import { IComponentInfo } from "sfx.module-manager";
import { electron } from "../../utilities/electron-adapter";

export class DialogService {

    public static getComponentInfo(): IComponentInfo {
        return {
            name: "dialog-service",
            version: electron.app.getVersion(),
            singleton: true,
            descriptor: () => new DialogService()            
        };
    }

    ShowDialog(pageUrl: string): void {
        const template = `
            <div id="main-modal-dialog" class="modal" tabindex="-1" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <webview src="${pageUrl}"></webview>
                    </div>
                </div>
            </div>`;

        $(document.body).append($(template));
        $("#main-modal-dialog").modal();
    }

    CloseDialog(): void {
        $("#main-modal-dialog").modal("hide").remove();
    }
}
