import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { PowershellCommand, CommandSafetyLevel, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { BadgeConstants } from 'src/app/Common/Constants';
import { FormArray, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-command',
  templateUrl: './command.component.html',
  styleUrls: ['./command.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommandComponent implements OnInit{

  constructor() { }

  @Input() command: PowershellCommand;
  safetyLevelEnum = CommandSafetyLevel;
  BadgeConstants = BadgeConstants;
  
  inputForm: FormGroup = new FormGroup({ requiredInputs: new FormArray([]), optionalInputs: new FormArray([]) });
  invalidInputs: { [key: string]: boolean } = {};
  
  requiredParams: PowershellCommandParameter[];
  optionalParams: PowershellCommandParameter[];

  ngOnInit() {
    this.command.parameters.forEach(p => {
      this.invalidInputs[p.name] = p.required;
    })

    this.requiredParams = this.command.parameters.filter(p => p.required);
    this.optionalParams = this.command.parameters.filter(p => !p.required);
  }

  goToReference(e: any) {
    e.stopPropagation();
    window.open(this.command.referenceUrl, '_blank');
  }

  get requiredInputs() {
    return this.inputForm.controls['requiredInputs'] as FormArray;
  }

  get optionalInputs() {
    return this.inputForm.controls['optionalInputs'] as FormArray;
  }
  displayInvalidInputs(): string {
    let result: string = "";

    for (let name in this.invalidInputs) {
      if (this.invalidInputs[name]) {
        result += `${name}, `;
      }
    }
  
    return result;
  }
}
