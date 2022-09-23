import { Component, Input, OnInit } from '@angular/core';
import { PowershellCommand } from 'src/app/Models/PowershellCommand';

@Component({
  selector: 'app-powershell-commands',
  templateUrl: './powershell-commands.component.html',
  styleUrls: ['./powershell-commands.component.scss']
})
export class PowershellCommandsComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  @Input() commands: PowershellCommand[];

}
