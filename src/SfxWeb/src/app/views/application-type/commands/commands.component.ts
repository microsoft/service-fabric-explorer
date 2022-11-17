import { Component, Injector } from '@angular/core';
import { PowershellCommand, PowershellCommandParameter, CommandParamTypes, CommandSafetyLevel, CommandFactory } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { ApplicationTypeBaseControllerDirective } from '../ApplicationTypeBase';

@Component({
  selector: 'app-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends ApplicationTypeBaseControllerDirective {

  commands: PowershellCommand[] = [];
  
  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
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
      `Get-ServiceFabricApplication -ApplicationTypeName "${this.appTypeName}"`,
      [excludeAppParam, appDefKindFilter, maxResults, getSinglePage, CommandFactory.GenTimeoutSecParam()]
    )
    this.commands.push(getApps);
    this.commands = [...this.commands];

  }

}
