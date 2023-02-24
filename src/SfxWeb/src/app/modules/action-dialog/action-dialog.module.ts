import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { ActionDialogComponent } from './action-dialog/action-dialog.component';
import { MessageWithConfirmationComponent } from './message-with-confirmation/message-with-confirmation.component';
import { ArmWarningComponent } from './arm-warning/arm-warning.component';
import { DialogBodyDirective } from './dialog-body.directive';

@NgModule({
  declarations: [ActionDialogComponent, MessageWithConfirmationComponent, ArmWarningComponent, DialogBodyDirective],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule
  ],
  exports: [ActionDialogComponent, MessageWithConfirmationComponent, ArmWarningComponent, DialogBodyDirective]
})
export class ActionDialogModule {}
