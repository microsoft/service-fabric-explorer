import { Component, Injector } from '@angular/core';
import { CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

@Component({
  selector: 'app-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends BaseControllerDirective {
  constructor(protected data: DataService, injector: Injector) {
    super(injector);
  }

  commands: PowershellCommand[] = [];
  
  setup() {
    this.setUpCommands();
  }

  
  protected setUpCommands(): void {
       
    const healthState = new PowershellCommandParameter("HealthState", CommandParamTypes.enum, { options: ["OK", "Warning", "Error", "Unknown"], required: true });
    const sourceId = new PowershellCommandParameter("SourceId", CommandParamTypes.string, { required: true });
    const healthProperty = new PowershellCommandParameter("HealthProperty", CommandParamTypes.string, {required: true});
    const description = new PowershellCommandParameter("Description", CommandParamTypes.string);
    const ttl = new PowershellCommandParameter("TimeToLiveSec", CommandParamTypes.number);
    const removeWhenExpired = new PowershellCommandParameter("RemoveWhenExpired", CommandParamTypes.switch)
    const sequenceNum = new PowershellCommandParameter("SequenceNumber", CommandParamTypes.number);
    const immediate = new PowershellCommandParameter("Immediate", CommandParamTypes.switch);
    const timeoutSec = new PowershellCommandParameter("TimeoutSec", CommandParamTypes.number);
    
    const healthReport = new PowershellCommand(
      'Send Health Report',
      'https://docs.microsoft.com/powershell/module/servicefabric/send-servicefabricclusterhealthreport',
      CommandSafetyLevel.safe,
      'Send-ServiceFabricClusterHealthReport',
      [healthState, sourceId, healthProperty, description, ttl, removeWhenExpired, sequenceNum, immediate, timeoutSec]
    );
      
    this.commands.push(healthReport);
    
    const getUpgrade = new PowershellCommand(
      'Get Cluster Upgrade',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricclusterupgrade',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricClusterUpgrade`,
      [timeoutSec]
    );
    this.commands.push(getUpgrade);

    const healthStateFilter = ["Default", "None", "Ok", "Warning", "Error", "All"];
    
    const appHealthPolMap = new PowershellCommandParameter("ApplicationHealthPolicyMap", CommandParamTypes.object);
    const appsFilter = new PowershellCommandParameter("ApplicationsFilter", CommandParamTypes.enum, { options: healthStateFilter, allowCustomValAndOptions: true });
    const appTypeHealthPolMap = new PowershellCommandParameter("ApplicationTypeHealthPolicyMap", CommandParamTypes.object);
    const considerWarnAsErr = new PowershellCommandParameter("ConsiderWarningAsError", CommandParamTypes.bool);
    const eventsFilter = new PowershellCommandParameter("EventsFilter", CommandParamTypes.enum, { options: healthStateFilter, allowCustomValAndOptions: true });
    const excludeHealthStat = new PowershellCommandParameter("ExcludeHealthStatistics", CommandParamTypes.switch);
    const includeSysAppHealthStat = new PowershellCommandParameter("IncludeSystemApplicationHealthStatistics", CommandParamTypes.switch);
    const maxPercUnhealthApp = new PowershellCommandParameter("MaxPercentUnhealthyApplications", CommandParamTypes.number);
    const maxPercUnhealthNodes = new PowershellCommandParameter("MaxPercentUnhealthyNodes", CommandParamTypes.number);
    const nodesFilter = new PowershellCommandParameter("NodesFilter", CommandParamTypes.enum, { options: healthStateFilter, allowCustomValAndOptions: true });
    const nodeTypeHealthPolMap = new PowershellCommandParameter("NodeTypeHealthPolicyMap", CommandParamTypes.object);

    const getHealth = new PowershellCommand(
      'Get Cluster Health',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricclusterhealth',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricClusterHealth`,
      [appHealthPolMap, appsFilter, appTypeHealthPolMap, considerWarnAsErr, eventsFilter, excludeHealthStat, includeSysAppHealthStat, maxPercUnhealthApp, maxPercUnhealthNodes, nodesFilter, nodeTypeHealthPolMap, timeoutSec]
    );

    this.commands.push(getHealth);
  }



}
