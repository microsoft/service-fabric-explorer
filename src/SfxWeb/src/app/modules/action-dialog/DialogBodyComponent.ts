import { EventEmitter } from "@angular/core";
import { Observable, Subscription } from "rxjs";

export interface DialogBodyComponent {
    inputs: any; //reference to the @input() decorator in an angular component
    disableSubmit?: EventEmitter<boolean>;
    disableSubmitSubscription?: Subscription;
    ok?: () => Observable<boolean>
}