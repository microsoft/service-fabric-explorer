import { Component, Input, OnInit } from '@angular/core';
import { CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';

@Component({
  selector: 'app-powershell-commands',
  templateUrl: './powershell-commands.component.html',
  styleUrls: ['./powershell-commands.component.scss']
})
export class PowershellCommandsComponent implements OnInit {

  constructor() { }

  @Input() commands: PowershellCommand[];

  ngOnInit() {
    const url = new PowershellCommandParameter('ConnectionEndpoint', CommandParamTypes.string,
      { options: [`${window.location.hostname}:19000`], allowCustomValAndOptions: true, required: true });
    
    const connectCommand = new PowershellCommand("Connect to Cluster",
      "https://docs.microsoft.com/powershell/module/servicefabric/connect-servicefabriccluster",
      CommandSafetyLevel.safe, 'Connect-ServiceFabricCluster',
      [url]);
    
    this.commands.unshift(connectCommand);
  }
}
