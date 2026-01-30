// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Type } from "@angular/core";
import { DialogBodyDirective } from "./dialog-body.directive";
import { DialogBodyComponent } from "./DialogBodyComponent";
import { MatDialog } from "@angular/material/dialog";
import { Observable } from "rxjs";
import { IsolatedAction } from "src/app/Models/Action";
import { MessageWithWaitConfirmationComponent } from "./message-with-wait-confirmation/message-with-wait-confirmation.component";

export class ActionDialogUtils {

    /**
     * creates a child DialogBodyComponent.
     * @param {DialogBodyDirective} parent The parent of the new component
     * @param {any} inputs The \@input() used by the new component
     * @param {Type<DialogBodyComponent>} template What the new component will be
     * @param {(value: boolean) => void} disableSubmit Called when the new component emits a disableSubmit event, if supplied, the template MUST have disableSubmit and disableSubmitSubscription, it also must unsubscribe from disableSubmitSubscription in ngOnDestroy
     * @return {DialogBodyComponent} The new component
     */
    public static createChildComponent(parent: DialogBodyDirective, inputs: any, template: Type<DialogBodyComponent>, disableSubmit?: (value: boolean) => void): DialogBodyComponent {

        const child: DialogBodyComponent = parent.viewContainerRef.createComponent(template).instance;
        child.inputs = inputs;
        if (child.disableSubmit && disableSubmit) {
            try {
                const sub = child.disableSubmit.subscribe((value: boolean) => disableSubmit(value));
                child.disableSubmitSubscription.add(sub);
            }
            catch (e){
                throw new Error(`The template must have disableSubmit and disableSubmitSubscription, and unsubscribe from disableSubmitSubscription in ngOnDestroy, else there will be potential memory leaks.\nOriginal error: ${e}`);
            }
        }

        return child;
    }


  public static wrapWithDangerousOperationDialogConfirmation(dialog: MatDialog, title: string, description: string, callback: Observable<any>): Observable<any> {
    const d = new IsolatedAction(
      dialog,
      title,
      title,
      '',
      {
        callback
      },
      MessageWithWaitConfirmationComponent,
      () => true,
      null,
      {
        title: `Confirm ${title} - Potential Data Loss`,
        class: 'error'
      },
      {
        template: null,
        inputs: {
          description
        }
      })
      return d.runWithFinalNotification();
  }
}
