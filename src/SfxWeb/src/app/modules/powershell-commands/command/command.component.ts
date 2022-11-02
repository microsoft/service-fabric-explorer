import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { PowershellCommand, CommandSafetyLevel, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { BadgeConstants } from 'src/app/Common/Constants';
import { FormGroup } from '@angular/forms';

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
  
  inputForm: FormGroup = new FormGroup({ requiredInputs: new FormGroup({}), optionalInputs: new FormGroup({}) });
  invalidInputs: string;
  
  requiredParams: PowershellCommandParameter[];
  optionalParams: PowershellCommandParameter[];

  ngOnInit() {
 
    this.requiredParams = this.command.parameters.filter(p => p.required);
    this.optionalParams = this.command.parameters.filter(p => !p.required);

    this.inputForm.valueChanges.subscribe(_ => { this.updateInvalidInputText(); });
  }

  goToReference(e: any) {
    e.stopPropagation();
    window.open(this.command.referenceUrl, '_blank');
  }

  get requiredInputs() {
    return this.inputForm.controls['requiredInputs'] as FormGroup;
  }

  get optionalInputs() {
    return this.inputForm.controls['optionalInputs'] as FormGroup;
  }

  updateInvalidInputText() {
    let invalids = [];
    for (let name in this.requiredInputs?.controls) {
      if (!this.requiredInputs.controls[name]?.valid)
        invalids.push(name);
    }
    this.invalidInputs = invalids.join(', ');
  }
}
