import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { PowershellCommandsComponent } from './powershell-commands/powershell-commands.component';
import { CommandComponent } from './command/command.component';
import { CommandInputComponent } from './command-input/command-input.component';
import { CommandEditorComponent } from './command-editor/command-editor.component';

@NgModule({
  declarations: [
    PowershellCommandsComponent,
    CommandComponent,
    CommandInputComponent
  ],
  imports: [
    CommandEditorComponent,
    CommonModule,
    SharedModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule
  ],
  exports: [
    PowershellCommandsComponent
  ]
})
export class PowershellCommandsModule { }
