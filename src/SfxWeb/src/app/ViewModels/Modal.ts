// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

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