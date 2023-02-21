import { EventEmitter } from "@angular/core";

export interface DialogBodyComponent {
    inputs: any;
    disableSubmit?: EventEmitter<boolean>;
}