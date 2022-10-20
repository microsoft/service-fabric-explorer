import { Component, Injector } from '@angular/core';
import { CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { ServiceBaseControllerDirective } from '../ServiceBase';

@Component({
  selector: 'app-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends ServiceBaseControllerDirective {
  
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
        'https://docs.microsoft.com/powershell/module/servicefabric/send-servicefabricservicehealthreport',
        CommandSafetyLevel.unsafe,
        `Send-ServiceFabricServiceHealthReport -ServiceName ${this.service?.name}`,
        [healthState, sourceId, healthProperty, description, ttl, removeWhenExpired, sequenceNum, immediate, timeoutSec]
    );

    this.commands.push(healthReport);

    const healthStateFilter = ["Default", "None", "Ok", "Warning", "Error", "All"];
    
    const considerWarnAsErr = new PowershellCommandParameter("ConsiderWarningAsError", CommandParamTypes.bool);
    const maxPercUnhealthPart = new PowershellCommandParameter("MaxPercentUnhealthyPartitionsperService", CommandParamTypes.number);
    const maxPercUnhealthRep = new PowershellCommandParameter("MaxPercentUnhealthyReplicasPerPartition", CommandParamTypes.number);
    const eventsFilter = new PowershellCommandParameter("EventsFilter", CommandParamTypes.enum, { options: healthStateFilter, allowCustomValAndOptions: true });
    const partitionsFilter = new PowershellCommandParameter("PartitionsFilter", CommandParamTypes.enum, { options: healthStateFilter, allowCustomValAndOptions: true });
    const excludeHealthStat = new PowershellCommandParameter("ExcludeHealthStatistics", CommandParamTypes.switch);

    const getHealth = new PowershellCommand(
      'Get Service Health',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricservicehealth',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricServiceHealth -ServiceName ${this.service?.name}`,
      [considerWarnAsErr, maxPercUnhealthPart, maxPercUnhealthRep, eventsFilter, partitionsFilter, excludeHealthStat, timeoutSec]
    );

    this.commands.push(getHealth);
    
    const getPartitions = new PowershellCommand(
      "Get Partitions",
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricpartition',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricPartition -ServiceName ${this.service?.name}`,
      [timeoutSec]
    )
    this.commands.push(getPartitions);
  }
}
