import { Component, Input, OnInit } from '@angular/core';
import { PowershellCommand, CommandParamTypes, PowershellCommandParameter, CommandSafetyLevel } from 'src/app/Models/PowershellCommand';
import { BadgeConstants } from 'src/app/Common/Constants';

@Component({
  selector: 'app-command',
  templateUrl: './command.component.html',
  styleUrls: ['./command.component.scss']
})
export class CommandComponent  {

  constructor() { }

  @Input() command: PowershellCommand;

  paramTypes = CommandParamTypes;
  safetyLevelEnum = CommandSafetyLevel;
  BadgeConstants = BadgeConstants;

  setDropdownValue(event: any, param: PowershellCommandParameter) {
    param.value = event.target.value;
  }

}
