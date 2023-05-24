import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { PowershellCommand, CommandSafetyLevel, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { BadgeConstants } from 'src/app/Common/Constants';
import { UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-command',
  templateUrl: './command.component.html',
  styleUrls: ['./command.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommandComponent implements OnInit{

  @Input() command: PowershellCommand;
  safetyLevelEnum = CommandSafetyLevel;
  BadgeConstants = BadgeConstants;
  
  inputForm: UntypedFormGroup = new UntypedFormGroup({ requiredInputs: new UntypedFormGroup({}), optionalInputs: new UntypedFormGroup({}) });
  invalidInputs: string;
  
  requiredParams: PowershellCommandParameter[];
  optionalParams: PowershellCommandParameter[];

  constructor(private cdr: ChangeDetectorRef) { }
  ngOnInit() {
 
    this.requiredParams = this.command.parameters.filter(p => p.required);
    this.optionalParams = this.command.parameters.filter(p => !p.required);

    this.inputForm.valueChanges.subscribe(_ => { this.updateInputs(); });
  }

  goToReference(e: any) {
    e.stopPropagation();
    window.open(this.command.referenceUrl, '_blank');
  }

  get requiredInputs() {
    return this.inputForm.controls['requiredInputs'] as UntypedFormGroup;
  }

  get optionalInputs() {
    return this.inputForm.controls['optionalInputs'] as UntypedFormGroup;
  }

  updateInputs() {
    let invalids = [];
    for (let name in this.requiredInputs?.controls) {
      this.command.getParam(name).value = this.requiredInputs.controls[name].value;
      if (!this.requiredInputs.controls[name]?.valid){
        invalids.push(name);
      }
    }
    this.invalidInputs = invalids.join(', ');

    for (let name in this.optionalInputs?.controls) {
      this.command.getParam(name).value = this.optionalInputs.controls[name].value;
    }

    this.cdr.detectChanges();
  }
}
