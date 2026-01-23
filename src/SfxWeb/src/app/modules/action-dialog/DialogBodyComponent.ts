// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { EventEmitter } from "@angular/core";
import { Observable, Subscription } from "rxjs";

export interface DialogBodyComponent {
    inputs: any; //reference to the @input() decorator in an angular component
    disableSubmit?: EventEmitter<boolean>;
    disableSubmitSubscription?: Subscription;
    ok?: () => Observable<boolean>
}