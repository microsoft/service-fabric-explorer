import { Component, Injector } from '@angular/core';
import { CommandFactory, CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

@Component({
  selector: 'app-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends BaseControllerDirective {
  commands: PowershellCommand[] = [];

  constructor(private data: DataService, injector: Injector) {
    super(injector);
  }
  
  afterDataSet(): void {
    this.setUpCommands();
  }

  setUpCommands() {
    const statusFilter = new PowershellCommandParameter("StatusFilter", CommandParamTypes.enum,
      { options: ['Default', 'Up', 'Down', 'Enabling', 'Disabling', 'Disabled', 'Unknown', 'Removed', 'All'] });
    const getSinglePage = new PowershellCommandParameter('GetSinglePage', CommandParamTypes.switch);
    const maxResults = new PowershellCommandParameter('MaxResults', CommandParamTypes.number);

    const getNodes = new PowershellCommand(
      'Get Nodes',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricnode',
      CommandSafetyLevel.safe,
      'Get-ServiceFabricNode',
      [statusFilter, getSinglePage, maxResults, CommandFactory.GenTimeoutSecParam()]
    );
    this.commands.push(getNodes);
    this.commands = [...this.commands];

  }


}
