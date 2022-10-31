import { Component, Input, ViewChild } from '@angular/core';
import { ControlContainer, FormControl, NgForm, NgModel } from '@angular/forms';
import { PowershellCommandParameter, CommandParamTypes } from 'src/app/Models/PowershellCommand';

@Component({
  selector: 'app-command-input',
  templateUrl: './command-input.component.html',
  styleUrls: ['./command-input.component.scss'],
  viewProviders: [ { provide: ControlContainer, useExisting: NgForm }]

})
export class CommandInputComponent{

  @ViewChild('normalInput') normalInput: NgModel;
  
  @Input() commandParam: PowershellCommandParameter;

  paramTypes = CommandParamTypes;

  setDropdownValue(event: any, param: PowershellCommandParameter) {
    param.value = event.target.value;
  }

}
