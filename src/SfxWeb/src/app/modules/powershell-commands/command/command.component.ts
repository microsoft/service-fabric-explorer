import { Component, Input, OnInit } from '@angular/core';
import { PowershellCommand, CommandInputTypes, PowershellCommandInput, CommandSafetyLevel } from 'src/app/Models/PowershellCommand';
import { BadgeConstants } from 'src/app/Common/Constants';

@Component({
  selector: 'app-command',
  templateUrl: './command.component.html',
  styleUrls: ['./command.component.scss']
})
export class CommandComponent  {

  constructor() { }

  @Input() command: PowershellCommand;

  inputTypes = CommandInputTypes;
  safetyLevelEnum = CommandSafetyLevel;
  BadgeConstants = BadgeConstants;

  setDropdownValue(event: any, input: PowershellCommandInput) {
    input.value = event.target.value;
  }

}
