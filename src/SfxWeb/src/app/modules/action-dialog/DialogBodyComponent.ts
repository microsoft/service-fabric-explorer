import { EventEmitter } from "@angular/core";
import { Observable } from "rxjs";

export interface DialogBodyComponent {
    inputs: any;
    disableSubmit?: EventEmitter<boolean>;
    ok?: () => Observable<boolean>
}