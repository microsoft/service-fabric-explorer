import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, UntypedFormControl, UntypedFormGroup, NgForm } from '@angular/forms';
import { PowershellCommandParameter, CommandParamTypes } from 'src/app/Models/PowershellCommand';

@Component({
  selector: 'app-command-input',
  templateUrl: './command-input.component.html',
  styleUrls: ['./command-input.component.scss'],
  viewProviders: [ { provide: ControlContainer, useExisting: NgForm }]

})
export class CommandInputComponent implements OnInit{

  @Input() commandParam: PowershellCommandParameter;
  @Input() inputGroup: UntypedFormGroup;

  value: UntypedFormControl = new UntypedFormControl('');

  paramTypes = CommandParamTypes;

  ngOnInit() {
    this.inputGroup.addControl(this.commandParam.name, this.value);
    this.value.setValue(this.commandParam.value);
  }

  setFormValue(value: any) {
    this.value.setValue(value);
  }


}
