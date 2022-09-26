import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { PowershellCommandsComponent } from './powershell-commands/powershell-commands.component';
import { CommandComponent } from './command/command.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    PowershellCommandsComponent,
    CommandComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule
  ],
  exports: [
    PowershellCommandsComponent
  ]
})
export class PowershellCommandsModule { }
