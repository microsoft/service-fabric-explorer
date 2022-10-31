import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { PowershellCommand, CommandSafetyLevel } from 'src/app/Models/PowershellCommand';
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
  inputForm: FormGroup = new FormGroup({ inputArray: new FormArray([]) });
  invalidInputs: { [key: string]: boolean } = {};
  
  safetyLevelEnum = CommandSafetyLevel;
  BadgeConstants = BadgeConstants;

  ngOnInit() {
    this.command.parameters.forEach(p => {
      this.invalidInputs[p.name] = p.required;
    })
  }

  goToReference(e: any) {
    e.stopPropagation();
    window.open(this.command.referenceUrl, '_blank');
  }

  get inputArray() {
    return this.inputForm.controls['inputArray'] as FormArray;
  }

  displayInvalidInputs(): string {
    console.log('he')
    let result: string = "The following parameters have invalid values: ";

    for (let name in this.invalidInputs) {
      if (this.invalidInputs[name]) {
        result += `${name}, `;
      }
    }
  
    return result;
  }
}
