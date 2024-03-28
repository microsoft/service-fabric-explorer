import { Component, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { CommandFactory, CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { DeployedAppBaseControllerDirective } from '../DeployedApplicationBase';

@Component({
  selector: 'app-deployed-app-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends DeployedAppBaseControllerDirective{

  commands: PowershellCommand[] = [];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.deployedApp.deployedServicePackages.refresh(messageHandler);
  }

  afterDataSet(): void {
    this.setUpCommands();
  }

  private setUpCommands() {

    const healthReport = CommandFactory.GenSendHealthReport("DeployedApplication", `-ApplicationName ${this.deployedApp.name} -NodeName "${this.nodeName}"`);
    this.commands.push(healthReport);

    const considerWarningAsErr = new PowershellCommandParameter("ConsiderWarningAsError", CommandParamTypes.bool);
    const eventsFilter = CommandFactory.GenHealthFilterParam("Events");
    const serviceFilter = CommandFactory.GenHealthFilterParam("DeployedServicePackages");
    const excludehealthStat = new PowershellCommandParameter("ExcludeHealthStatistics", CommandParamTypes.switch);

    const getHealth = new PowershellCommand(
      'Get Deployed Application Health',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricdeployedapplicationhealth',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricDeployedApplicationHealth -NodeName "${this.nodeName}" -ApplicationName ${this.deployedApp.name}`,
      [eventsFilter, serviceFilter, excludehealthStat, considerWarningAsErr, CommandFactory.GenTimeoutSecParam()]
    );
    this.commands.push(getHealth);


    const getDeployedApp = new PowershellCommand(
      "Get Deployed Application",
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricdeployedapplication',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricDeployedApplication -NodeName "${this.nodeName}" -ApplicationName ${this.deployedApp.name}`,
      [new PowershellCommandParameter("IncludeHealthState", CommandParamTypes.switch), CommandFactory.GenTimeoutSecParam()]
    );

    this.commands.push(getDeployedApp);

    const includeHealthState = new PowershellCommandParameter("IncludeHealthState", CommandParamTypes.switch);
    const getSinglePage = new PowershellCommandParameter('GetSinglePage', CommandParamTypes.switch);
    const maxResults = new PowershellCommandParameter('MaxResults', CommandParamTypes.number);

    const getServices = new PowershellCommand(
      'Get Deployed Service Packages',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricdeployedservicepackage',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricDeployedServicePackage -NodeName "${this.nodeName}" -ApplicationName ${this.deployedApp.name}`,
      [includeHealthState, getSinglePage, maxResults, CommandFactory.GenTimeoutSecParam()]
    )
    this.commands.push(getServices);

    const getReplica = new PowershellCommand(
      "Get Deployed Replicas",
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricdeployedreplica',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricDeployedReplica -NodeName "${this.nodeName}" -ApplicationName ${this.deployedApp.name}`,
      [CommandFactory.GenTimeoutSecParam()]
    );

    this.commands.push(getReplica);
    this.commands = [...this.commands];

  }
}
