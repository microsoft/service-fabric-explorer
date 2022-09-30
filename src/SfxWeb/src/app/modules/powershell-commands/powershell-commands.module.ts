import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { PowershellCommandsComponent } from './powershell-commands/powershell-commands.component';
import { CommandComponent } from './command/command.component';
import { FormatParamsPipe } from './format-params.pipe';
import { ToScriptPipe } from './to-script.pipe';


@NgModule({
  declarations: [
    PowershellCommandsComponent,
    CommandComponent,
    FormatParamsPipe,
    ToScriptPipe
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
