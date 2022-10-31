import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormArray, FormControl, NgForm } from '@angular/forms';
import { PowershellCommandParameter, CommandParamTypes } from 'src/app/Models/PowershellCommand';

@Component({
  selector: 'app-command-input',
  templateUrl: './command-input.component.html',
  styleUrls: ['./command-input.component.scss'],
  viewProviders: [ { provide: ControlContainer, useExisting: NgForm }]

})
export class CommandInputComponent implements OnInit{

  @Input() commandParam: PowershellCommandParameter;
  @Input() inputArray: FormArray;
  @Input() invalidInputs: { [key: string]: boolean }

  value: FormControl = new FormControl('');

  paramTypes = CommandParamTypes;

  ngOnInit() {
    this.inputArray.push(this.value);
  }

  setDropdownValue(event: any) {
    this.value.setValue(event.target.value);
    this.setParamValue(event);
  }

  setParamValue(event: any) {
    this.commandParam.value = event.target.value;
    this.invalidInputs[this.commandParam.name] = !this.value.valid;
  }

}
