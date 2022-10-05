import { Component, Input } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';
import { PowershellCommandParameter, CommandParamTypes } from 'src/app/Models/PowershellCommand';

@Component({
  selector: 'app-command-input',
  templateUrl: './command-input.component.html',
  styleUrls: ['./command-input.component.scss'],
  viewProviders: [ { provide: ControlContainer, useExisting: NgForm }]

})
export class CommandInputComponent{

  @Input() commandParam: PowershellCommandParameter;

  paramTypes = CommandParamTypes;

  setDropdownValue(event: any, param: PowershellCommandParameter) {
    param.value = event.target.value;
  }

}
