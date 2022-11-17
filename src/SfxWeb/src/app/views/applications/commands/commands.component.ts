import { Component, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { CommandFactory, CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { map } from 'rxjs/operators';
import { Application } from 'src/app/Models/DataModels/Application';


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
    const appDefKindFilter = new PowershellCommandParameter('ApplicationDefinitionKindFilter', CommandParamTypes.enum,
      { options: ['Default', 'ServiceFabricApplicationDescription', 'Compose', 'MeshApplicationDescription', 'All'], allowCustomValAndOptions: true });
    
    const excludeAppParam = new PowershellCommandParameter('ExcludeApplicationParameters', CommandParamTypes.switch);
    const getSinglePage = new PowershellCommandParameter('GetSinglePage', CommandParamTypes.switch);
    const maxResults = new PowershellCommandParameter('MaxResults', CommandParamTypes.number);

    const getApps = new PowershellCommand(
      'Get Applications',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricapplication',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricApplication`,
      [excludeAppParam, appDefKindFilter, maxResults, getSinglePage, CommandFactory.GenTimeoutSecParam()]
    )
    this.commands.push(getApps);
    this.commands = [...this.commands];

  }
}
