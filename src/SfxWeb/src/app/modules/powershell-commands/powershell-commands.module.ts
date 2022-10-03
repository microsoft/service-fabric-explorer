import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { PowershellCommandsComponent } from './powershell-commands/powershell-commands.component';
import { CommandComponent } from './command/command.component';

@NgModule({
  declarations: [
    PowershellCommandsComponent,
    CommandComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    NgbModule
  ],
  exports: [
    PowershellCommandsComponent
  ]
})
export class PowershellCommandsModule { }
