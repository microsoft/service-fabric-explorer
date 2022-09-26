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

  onCheckboxChange(event: any, input: PowershellCommandInput) {
    console.log(event);
    if (event.target.checked) {
      input.value = event.target.value;
    }
    else {
      input.value = "";
    }
  }

}
