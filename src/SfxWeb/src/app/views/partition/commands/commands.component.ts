import { Component, Injector } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { CommandFactory, CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
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

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.data.getNodes();
  }

  afterDataSet(): void {
    this.setUpCommands();
  } 

  private setUpCommands() {

    const healthReport = CommandFactory.GenSendHealthReport("Partition", `-PartitionId ${this.partitionId}`);
    this.commands.push(healthReport);

    const considerWarnAsErr = new PowershellCommandParameter("ConsiderWarningAsError", CommandParamTypes.bool);
    const maxPercUnhealthRep = new PowershellCommandParameter("MaxPercentUnhealthyReplicasPerPartition", CommandParamTypes.number);
    const eventsFilter = CommandFactory.GenHealthFilterParam("Events");
    const replicasFilter = CommandFactory.GenHealthFilterParam("Replicas");
    const excludeHealthStat = new PowershellCommandParameter("ExcludeHealthStatistics", CommandParamTypes.switch);

    const getHealth = new PowershellCommand(
      'Get Partition Health',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricpartitionhealth',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricPartitionHealth -PartitionId ${this.partitionId}`,
      [eventsFilter, replicasFilter, maxPercUnhealthRep, excludeHealthStat, considerWarnAsErr, CommandFactory.GenTimeoutSecParam()]
    );

    this.commands.push(getHealth);

    const getPartition = new PowershellCommand(
      "Get Partition",
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricpartition',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricPartition -PartitionId ${this.partitionId}`,
      [CommandFactory.GenTimeoutSecParam()]
    )
    this.commands.push(getPartition);

    const statusFilter = new PowershellCommandParameter("ReplicaStatusFilter", CommandParamTypes.enum,
      { options: ['Default', 'InBuild', 'Standby', 'Ready', 'Down', 'Dropped', 'Completed', 'All'] });
    
    const getReplicas = new PowershellCommand(
      'Get Replicas',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricreplica',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricReplica -PartitionId ${this.partitionId}`,
      [statusFilter, CommandFactory.GenTimeoutSecParam()]
    );

    this.commands.push(getReplicas);

    if (this.partition.isStatefulService) {
      
      const completionMode = new PowershellCommandParameter("CommandCompletionMode", CommandParamTypes.enum, { options: ['Invalid', 'DoNotVerify', 'Verify'] });
      const restartPrimeReplica = new PowershellCommand(
        "Restart Primary Replica",
        'https://docs.microsoft.com/powershell/module/servicefabric/restart-servicefabricreplica',
        CommandSafetyLevel.unsafe,
        `Restart-ServiceFabricReplica -ServiceName ${this.partition.parent.name} -PartitionId ${this.partitionId} -ReplicaKindPrimary`,
        [completionMode, CommandFactory.GenTimeoutSecParam()], true
      )
      this.commands.push(restartPrimeReplica);
      
      const nodes = this.data.nodes.collection.map(node => node.name);
      
      const movePrimeReplicaSpecific = new PowershellCommand(
        "Move Primary Replica To Specifc Node",
        'https://docs.microsoft.com/powershell/module/servicefabric/move-servicefabricprimaryreplica',
        CommandSafetyLevel.unsafe,
        `Move-ServiceFabricPrimaryReplica -ServiceName ${this.partition.parent.name} -PartitionId ${this.partitionId}`,
        [CommandFactory.GenNodeListParam("NodeName", nodes), CommandFactory.GenIgnoreConstraintsParam(), CommandFactory.GenTimeoutSecParam()], true
      )
      this.commands.push(movePrimeReplicaSpecific);
  
      const movePrimeReplicaRandom = new PowershellCommand(
        "Move Primary Replica To Random Node",
        'https://docs.microsoft.com/powershell/module/servicefabric/move-servicefabricprimaryreplica',
        CommandSafetyLevel.unsafe,
        `Move-ServiceFabricPrimaryReplica -ServiceName ${this.partition.parent.name} -PartitionId ${this.partitionId}`,
        [CommandFactory.GenIgnoreConstraintsParam(), CommandFactory.GenTimeoutSecParam()], true
      )
      this.commands.push(movePrimeReplicaRandom);
    }
    this.commands = [...this.commands];
  }
}
