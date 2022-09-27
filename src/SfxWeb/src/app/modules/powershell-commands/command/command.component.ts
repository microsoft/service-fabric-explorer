import { Component, Input, OnInit } from '@angular/core';
import { PowershellCommand, CommandInputTypes, PowershellCommandInput } from 'src/app/Models/PowershellCommand';

@Component({
  selector: 'app-command',
  templateUrl: './command.component.html',
  styleUrls: ['./command.component.scss']
})
export class CommandComponent  {

  constructor() { }

  @Input() command: PowershellCommand;
  inputTypes = CommandInputTypes;

  setDropdownValue(event: any, input: PowershellCommandInput) {
    input.value = event.target.value;
  }

}
