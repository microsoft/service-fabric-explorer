import { Component, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { NodeBaseControllerDirective } from '../NodeBase';

@Component({
  selector: 'app-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends NodeBaseControllerDirective {
  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  commands: PowershellCommand[] = [];
  
  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.node.deployedApps.refresh(messageHandler);
  }
  
  afterDataSet() {
    this.setUpCommands();
    
  }

  protected setUpCommands(): void {

    this.commands.push(
        new PowershellCommand('Restart',
            'https://docs.microsoft.com/powershell/module/servicefabric/restart-servicefabricnode',
            CommandSafetyLevel.safe,
            `Restart-ServiceFabricNode -NodeName "${this.nodeName}" -NodeInstanceId ${this.node.raw.InstanceId}`)
    );

    const healthState = new PowershellCommandParameter("HealthState", CommandParamTypes.enum, { options: ["OK", "Warning", "Error", "Unknown"], required: true });
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
        'https://docs.microsoft.com/powershell/module/servicefabric/send-servicefabricnodehealthreport',
        CommandSafetyLevel.safe,
        `Send-ServiceFabricNodeHealthReport -NodeName "${this.nodeName}"`,
        [healthState, sourceId, healthProperty, description, ttl, removeWhenExpired, sequenceNum, immediate, timeoutSec]
    );

    this.commands.push(healthReport);

    const considerWarnAsErr = new PowershellCommandParameter("ConsiderWarningAsError", CommandParamTypes.bool);
    const maxPercUnhealthyNodes = new PowershellCommandParameter("MaxPercentUnhealthyNodes", CommandParamTypes.number);
    const eventsFilter = new PowershellCommandParameter("EventsFilter", CommandParamTypes.enum, { options: ["Default", "None", "Ok", "Warning", "Error", "All"], allowCustomValAndOptions: true });

    const getHealth = new PowershellCommand(
      'Get Node Health',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricnodehealth',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricDeployedServicePackageHealth -NodeName "${this.nodeName}"`,
      [considerWarnAsErr, maxPercUnhealthyNodes, eventsFilter, timeoutSec]
    );

    this.commands.push(getHealth);

    const deployedApps = this.node.deployedApps.collection;

    const appName = new PowershellCommandParameter("ApplicationName", CommandParamTypes.enum, { options: deployedApps.map(app => app.name) });
    const getSinglePage = new PowershellCommandParameter("GetSinglePage", CommandParamTypes.switch);
    const includeHealthState = new PowershellCommandParameter("IncludeHealthState", CommandParamTypes.switch);
    const maxResults = new PowershellCommandParameter("MaxResults", CommandParamTypes.number);

    const getDeployedApp = new PowershellCommand(
      "Get Deployed Applications",
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricdeployedapplication',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricDeployedApplication -NodeName "${this.nodeName}"`,
      [appName, getSinglePage, includeHealthState, maxResults]
    );

    this.commands.push(getDeployedApp);
  }


}
