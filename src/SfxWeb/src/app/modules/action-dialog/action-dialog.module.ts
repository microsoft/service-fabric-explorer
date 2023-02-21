import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { ActionDialogComponent } from './action-dialog/action-dialog.component';
import { ActionDialogTemplateComponent } from './action-dialog-template/action-dialog-template.component';
import { ArmWarningComponent } from './arm-warning/arm-warning.component';
import { DialogBodyDirective } from './dialog-body.directive';

@NgModule({
  declarations: [ActionDialogComponent, ActionDialogTemplateComponent, ArmWarningComponent, DialogBodyDirective],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule
  ],
  exports: [ActionDialogComponent, ActionDialogTemplateComponent, ArmWarningComponent, DialogBodyDirective]
})
export class ActionDialogModule {}
