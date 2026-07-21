import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ControlContainer, UntypedFormControl, UntypedFormGroup, NgForm } from '@angular/forms';
import { PowershellCommandParameter, CommandParamTypes } from 'src/app/Models/PowershellCommand';

@Component({
    selector: 'app-command-input',
    templateUrl: './command-input.component.html',
    styleUrls: ['./command-input.component.scss'],
    viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CommandInputComponent implements OnInit{

  @Input() commandParam: PowershellCommandParameter;
  @Input() inputGroup: UntypedFormGroup;

  value: UntypedFormControl = new UntypedFormControl('');

  paramTypes = CommandParamTypes;

  ngOnInit() {
    this.inputGroup.addControl(this.commandParam.name, this.value);
  }

  setFormValue(value: any) {
    this.value.setValue(value);
  }


}
