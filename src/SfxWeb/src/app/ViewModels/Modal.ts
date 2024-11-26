import { DialogBodyComponent } from "../modules/action-dialog/DialogBodyComponent";
import { Type } from "@angular/core"

export interface IModalTitle {
    title: string,
    class?: string
}

export interface IModalBody {
    template?: Type<DialogBodyComponent>;
    inputs: any;
}

export interface IModalData {
    title: string,
    modalTitle?: IModalTitle, //TODO: turn into required after reworking isolatedAction
    modalBody?: IModalBody
}