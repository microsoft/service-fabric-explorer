import { Component, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { DeployedAppBaseControllerDirective } from '../DeployedApplicationBase';

@Component({
  selector: 'app-commands',
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
        'https://docs.microsoft.com/powershell/module/servicefabric/send-servicefabricdeployedapplicationhealthreport',
        CommandSafetyLevel.unsafe,
        `Send-ServiceFabricDeployedApplicationHealthReport -ApplicationName ${this.deployedApp.name} -NodeName "${this.nodeName}"`,
        [healthState, sourceId, healthProperty, description, ttl, removeWhenExpired, sequenceNum, immediate, timeoutSec]
    );

    this.commands.push(healthReport);

    const healthFilter = ["Default", "None", "Ok", "Warning", "Error", "All"];
    const considerWarningAsErr = new PowershellCommandParameter("ConsiderWarningAsError", CommandParamTypes.bool);
    const eventsFilter = new PowershellCommandParameter("EventsFilter", CommandParamTypes.enum, { options: healthFilter, allowCustomValAndOptions: true });
    const serviceFilter = new PowershellCommandParameter("DeployedServicePackagesFilter", CommandParamTypes.enum, { options: healthFilter, allowCustomValAndOptions: true });
    const excludehealthStat = new PowershellCommandParameter("ExcludeHealthStatistics", CommandParamTypes.switch);

    const getHealth = new PowershellCommand(
      'Get Deployed Application Health',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricdeployedapplicationhealth',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricDeployedApplicationHealth -NodeName "${this.nodeName}" -ApplicationName ${this.deployedApp.name}`,
      [eventsFilter, serviceFilter, excludehealthStat, considerWarningAsErr, timeoutSec]
    );
    this.commands.push(getHealth);

    const includeHealthState = new PowershellCommandParameter("IncludeHealthState", CommandParamTypes.switch);

    const getDeployedApp = new PowershellCommand(
      "Get Deployed Application",
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricdeployedapplication',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricDeployedApplication -NodeName "${this.nodeName}" -ApplicationName ${this.deployedApp.name}`,
      [includeHealthState,timeoutSec]
    );

    this.commands.push(getDeployedApp);

    const getSinglePage = new PowershellCommandParameter('GetSinglePage', CommandParamTypes.switch);
    const maxResults = new PowershellCommandParameter('MaxResults', CommandParamTypes.number);

    const getServices = new PowershellCommand(
      'Get Deployed Service Packages',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricdeployedservicepackage',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricDeployedServicePackage -NodeName "${this.nodeName}" -ApplicationName ${this.deployedApp.name}`,
      [includeHealthState, getSinglePage, maxResults, timeoutSec]
    )
    this.commands.push(getServices);

    const getReplica = new PowershellCommand(
      "Get Deployed Replicas",
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricdeployedreplica',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricDeployedReplica -NodeName "${this.nodeName}" -ApplicationName ${this.deployedApp.name}`,
      [timeoutSec]
    );
    
    this.commands.push(getReplica);
  }
}
