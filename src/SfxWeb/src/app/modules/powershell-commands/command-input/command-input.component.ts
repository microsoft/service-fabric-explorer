import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormControl, FormGroup, NgForm } from '@angular/forms';
import { PowershellCommandParameter, CommandParamTypes } from 'src/app/Models/PowershellCommand';

@Component({
  selector: 'app-command-input',
  templateUrl: './command-input.component.html',
  styleUrls: ['./command-input.component.scss'],
  viewProviders: [ { provide: ControlContainer, useExisting: NgForm }]

})
export class CommandInputComponent implements OnInit{

  @Input() commandParam: PowershellCommandParameter;
  @Input() inputGroup: FormGroup;

  value: FormControl = new FormControl('');

  paramTypes = CommandParamTypes;

  ngOnInit() {
    this.inputGroup.addControl(this.commandParam.name, this.value);
  }

  setDropdownValue(event: any) {
    this.value.setValue(event.target.value);
    this.setParamValue(event);
  }

  setParamValue(event: any) {
    this.commandParam.value = event.target.value;
  }

}
