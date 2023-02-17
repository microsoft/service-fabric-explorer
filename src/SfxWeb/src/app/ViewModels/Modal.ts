import { DialogBodyComponent } from "../shared/component/DialogBodyComponent";
import { Type } from "@angular/core"
export interface IModalData {
    title: string,
    modalTitle?: string,
    modalMessage?: string,
    confirmationKeyword?: string
    isWarning?: boolean,
    bodyTemplate?: Type<DialogBodyComponent>;
    bodyInputs?: any;

}