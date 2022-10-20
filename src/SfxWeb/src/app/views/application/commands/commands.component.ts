import { Component, Injector } from '@angular/core';
import { CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { ApplicationBaseControllerDirective } from '../applicationBase';

@Component({
  selector: 'app-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends ApplicationBaseControllerDirective{
  
  commands: PowershellCommand[] = [];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  afterDataSet(): void {
    this.setUpCommands();
  }

  private setUpCommands() {
    const healthState = new PowershellCommandParameter("HealthState", CommandParamTypes.enum, { options: ["OK", "Warning", "Error", "Unknown"], required: true});
    const sourceId = new PowershellCommandParameter("SourceId", CommandParamTypes.string, {required: true});
    const healthProperty = new PowershellCommandParameter("HealthProperty", CommandParamTypes.string, {required: true});
    const description = new PowershellCommandParameter("Description", CommandParamTypes.string);
    const ttl = new PowershellCommandParameter("TimeToLiveSec", CommandParamTypes.number);
    const removeWhenExpired = new PowershellCommandParameter("RemoveWhenExpired", CommandParamTypes.switch)
    const sequenceNum = new PowershellCommandParameter("SequenceNumber", CommandParamTypes.number);
    const immediate = new PowershellCommandParameter("Immediate", CommandParamTypes.switch);
    const timeoutSec = new PowershellCommandParameter("TimeoutSec", CommandParamTypes.number);
    
    const healthReport = new PowershellCommand(
        'Send Health Report',
        'https://docs.microsoft.com/powershell/module/servicefabric/send-servicefabricapplicationhealthreport',
        CommandSafetyLevel.unsafe,
        `Send-ServiceFabricApplicationHealthReport -ApplicationName ${this.app?.name}`,
        [healthState, sourceId, healthProperty, description, ttl, removeWhenExpired, sequenceNum, immediate, timeoutSec]
    );

    this.commands.push(healthReport);


    const getUpgrade = new PowershellCommand(
      'Get Application Upgrade',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricapplicationupgrade',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricApplicationUpgrade -ApplicationName ${this.app?.name}`,
      [timeoutSec]
    );
    this.commands.push(getUpgrade);

    const healthStateFilter = ["Default", "None", "Ok", "Warning", "Error", "All"];

    const considerWarnAsErr = new PowershellCommandParameter("ConsiderWarningAsError", CommandParamTypes.bool);
    const deployedAppFilter = new PowershellCommandParameter("DeployedApplicationFilter", CommandParamTypes.enum, { options: healthStateFilter, allowCustomValAndOptions: true });
    const eventsFilter = new PowershellCommandParameter("EventsFilter", CommandParamTypes.enum, { options: healthStateFilter, allowCustomValAndOptions: true });
    const excludeHealthStat = new PowershellCommandParameter("ExcludeHealthStatistics", CommandParamTypes.switch);
    const maxPercUnhealthApp = new PowershellCommandParameter("MaxPercentUnhealthyDeployedApplications", CommandParamTypes.number);
    const maxPercUnhealthPart = new PowershellCommandParameter("MaxPercentUnhealthyPartitionsPerService", CommandParamTypes.number);
    const maxPercUnhealthRep = new PowershellCommandParameter("MaxPercentUnhealthyReplicasPerPartition", CommandParamTypes.number);
    const maxPercUnhealthServ = new PowershellCommandParameter("MaxPercentUnhealthyServices", CommandParamTypes.number);
    const servicesFilter = new PowershellCommandParameter("ServicesFilter", CommandParamTypes.enum, { options: healthStateFilter, allowCustomValAndOptions: true });

    const getHealth = new PowershellCommand(
      'Get Application Health',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricapplicationhealth',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricApplicationHealth -ApplicationName ${this.app?.name}`,
      [considerWarnAsErr, deployedAppFilter, eventsFilter, excludeHealthStat, maxPercUnhealthApp, maxPercUnhealthPart, maxPercUnhealthRep, maxPercUnhealthServ, servicesFilter, timeoutSec]
    );

    this.commands.push(getHealth);

    const getApp = new PowershellCommand(
      'Get Application',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricapplication',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricApplication -ApplicationName ${this.app?.name}`,
      [new PowershellCommandParameter('ExcludeApplicationParameters', CommandParamTypes.switch), timeoutSec]
    )
    this.commands.push(getApp);
  }
}
