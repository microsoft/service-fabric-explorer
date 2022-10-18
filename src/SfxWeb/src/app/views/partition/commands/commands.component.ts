import { Component, Injector } from '@angular/core';
import { CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { PartitionBaseControllerDirective } from '../PartitionBase';

@Component({
  selector: 'app-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends PartitionBaseControllerDirective{
  
  commands: PowershellCommand[] = [];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  setup(): void {
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
        'https://docs.microsoft.com/powershell/module/servicefabric/send-servicefabricpartitionhealthreport',
        CommandSafetyLevel.safe,
        `Send-ServiceFabricPartitionHealthReport -PartitionId ${this.partitionId}`,
        [healthState, sourceId, healthProperty, description, ttl, removeWhenExpired, sequenceNum, immediate, timeoutSec]
    );

    this.commands.push(healthReport);

    const healthStateFilter = ["Default", "None", "Ok", "Warning", "Error", "All"];
    
    const considerWarnAsErr = new PowershellCommandParameter("ConsiderWarningAsError", CommandParamTypes.bool);
    const maxPercUnhealthRep = new PowershellCommandParameter("MaxPercentUnhealthyReplicasPerPartition", CommandParamTypes.number);
    const eventsFilter = new PowershellCommandParameter("EventsFilter", CommandParamTypes.enum, { options: healthStateFilter, allowCustomValAndOptions: true });
    const replicasFilter = new PowershellCommandParameter("ReplicasFilter", CommandParamTypes.enum, { options: healthStateFilter, allowCustomValAndOptions: true });
    const excludeHealthStat = new PowershellCommandParameter("ExcludeHealthStatistics", CommandParamTypes.switch);

    const getHealth = new PowershellCommand(
      'Get Partition Health',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricpartitionhealth',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricPartitionHealth -PartitionId ${this.partitionId}`,
      [considerWarnAsErr, maxPercUnhealthRep, eventsFilter, replicasFilter, excludeHealthStat, timeoutSec]
    );

    this.commands.push(getHealth);

    const getPartition = new PowershellCommand(
      "Get Partition",
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricpartition',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricPartition -PartitionId ${this.partitionId}`,
      [timeoutSec]
    )
    this.commands.push(getPartition);
  }
}
