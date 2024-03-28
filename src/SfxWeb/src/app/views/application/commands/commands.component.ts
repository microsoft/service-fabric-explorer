import { Component, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { CommandFactory, CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { ApplicationBaseControllerDirective } from '../applicationBase';

@Component({
  selector: 'app-app-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends ApplicationBaseControllerDirective{

  commands: PowershellCommand[] = [];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.app?.serviceTypes.refresh(messageHandler);
  }

  afterDataSet(): void {
    this.setUpCommands();
  }

  private setUpCommands() {
    const healthReport = CommandFactory.GenSendHealthReport('Application', `-ApplicationName ${this.app?.name}`);
    this.commands.push(healthReport);


    const getUpgrade = new PowershellCommand(
      'Get Application Upgrade',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricapplicationupgrade',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricApplicationUpgrade -ApplicationName ${this.app?.name}`,
      [CommandFactory.GenTimeoutSecParam()]
    );
    this.commands.push(getUpgrade);

    const considerWarnAsErr = new PowershellCommandParameter("ConsiderWarningAsError", CommandParamTypes.bool);
    const deployedAppFilter = CommandFactory.GenHealthFilterParam('DeployedApplications');
    const eventsFilter = CommandFactory.GenHealthFilterParam("Events");
    const excludeHealthStat = new PowershellCommandParameter("ExcludeHealthStatistics", CommandParamTypes.switch);
    const maxPercUnhealthApp = new PowershellCommandParameter("MaxPercentUnhealthyDeployedApplications", CommandParamTypes.number);
    const maxPercUnhealthPart = new PowershellCommandParameter("MaxPercentUnhealthyPartitionsPerService", CommandParamTypes.number);
    const maxPercUnhealthRep = new PowershellCommandParameter("MaxPercentUnhealthyReplicasPerPartition", CommandParamTypes.number);
    const maxPercUnhealthServ = new PowershellCommandParameter("MaxPercentUnhealthyServices", CommandParamTypes.number);
    const servicesFilter = CommandFactory.GenHealthFilterParam("Services");

    const getHealth = new PowershellCommand(
      'Get Application Health',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricapplicationhealth',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricApplicationHealth -ApplicationName ${this.app?.name}`,
      [deployedAppFilter, eventsFilter, servicesFilter, maxPercUnhealthApp, maxPercUnhealthPart, maxPercUnhealthRep, maxPercUnhealthServ, excludeHealthStat, considerWarnAsErr, CommandFactory.GenTimeoutSecParam()]
    );

    this.commands.push(getHealth);

    const getApp = new PowershellCommand(
      'Get Application',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricapplication',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricApplication -ApplicationName ${this.app?.name}`,
      [new PowershellCommandParameter('ExcludeApplicationParameters', CommandParamTypes.switch), CommandFactory.GenTimeoutSecParam()]
    )
    this.commands.push(getApp);

    const serviceType = new PowershellCommandParameter('ServiceTypeName', CommandParamTypes.string, { options: this.app?.serviceTypes.collection.map(_ => _.name), allowCustomValAndOptions: true });
    const getSinglePage = new PowershellCommandParameter('GetSinglePage', CommandParamTypes.switch);
    const maxResults = new PowershellCommandParameter('MaxResults', CommandParamTypes.number);

    const getServices = new PowershellCommand(
      'Get Services',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricservice',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricService -ApplicationName ${this.app?.name}`,
      [serviceType, getSinglePage, maxResults, CommandFactory.GenTimeoutSecParam()]
    )

    this.commands.push(getServices);
    this.commands = [...this.commands];
  }
}
