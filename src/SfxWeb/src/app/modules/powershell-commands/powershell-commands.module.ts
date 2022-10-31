import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { PowershellCommandsComponent } from './powershell-commands/powershell-commands.component';
import { CommandComponent } from './command/command.component';
import { CommandInputComponent } from './command-input/command-input.component';

@NgModule({
  declarations: [
    PowershellCommandsComponent,
    CommandComponent,
    CommandInputComponent
  ],
  imports: [
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
