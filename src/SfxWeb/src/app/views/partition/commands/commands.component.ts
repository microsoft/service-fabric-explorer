import { Component, Injector } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
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

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return forkJoin([
      this.data.getNodes(),
      this.partition.replicas.refresh(messageHandler)
    ]);
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
        'https://docs.microsoft.com/powershell/module/servicefabric/send-servicefabricpartitionhealthreport',
        CommandSafetyLevel.unsafe,
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

    const replicaId = new PowershellCommandParameter("ReplicaOrInstanceId", CommandParamTypes.enum, { options: this.partition.replicas.collection.map(r => r.id) });
    const statusFilter = new PowershellCommandParameter("ReplicaStatusFilter", CommandParamTypes.enum,
      { options: ['Default', 'InBuild', 'Standby', 'Ready', 'Down', 'Dropped', 'Completed', 'All'] });
    
    const getReplicas = new PowershellCommand(
      'Get Replicas',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricreplica',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricReplica -PartitionId ${this.partitionId}`,
      [replicaId, statusFilter, timeoutSec]
    );

    this.commands.push(getReplicas);

    if (this.partition.isStatefulService) {
      
      const completionMode = new PowershellCommandParameter("CommandCompletionMode", CommandParamTypes.enum, { options: ['Invalid', 'DoNotVerify', 'Verify'] });
      const restartPrimeReplica = new PowershellCommand(
        "Restart Primary Replica",
        'https://docs.microsoft.com/powershell/module/servicefabric/restart-servicefabricreplica',
        CommandSafetyLevel.safe,
        `Restart-ServiceFabricReplica -ServiceName ${this.partition.parent.name} -PartitionId ${this.partitionId} -ReplicaKindPrimary`,
        [completionMode, timeoutSec]
      )
      this.commands.push(restartPrimeReplica);

      const ignoreConstraints = new PowershellCommandParameter('IgnoreConstraints', CommandParamTypes.switch);
      
      const nodeName = new PowershellCommandParameter('NodeName', CommandParamTypes.string,
        { required: true, options: this.data.nodes.collection.map(node => node.name), allowCustomValAndOptions: true});
  
      const movePrimeReplicaSpecific = new PowershellCommand(
        "Move Primary Replica To Specifc Node",
        'https://docs.microsoft.com/powershell/module/servicefabric/move-servicefabricprimaryreplica',
        CommandSafetyLevel.safe,
        `Move-ServiceFabricPrimaryReplica -ServiceName ${this.partition.parent.name} -PartitionId ${this.partitionId}`,
        [nodeName, ignoreConstraints, timeoutSec]
      )
      this.commands.push(movePrimeReplicaSpecific);
  
      const movePrimeReplicaRandom = new PowershellCommand(
        "Move Primary Replica To Random Node",
        'https://docs.microsoft.com/powershell/module/servicefabric/move-servicefabricprimaryreplica',
        CommandSafetyLevel.safe,
        `Move-ServiceFabricPrimaryReplica -ServiceName ${this.partition.parent.name} -PartitionId ${this.partitionId}`,
        [ignoreConstraints, timeoutSec]
      )
      this.commands.push(movePrimeReplicaRandom);
  
      const currSecondReplica = new PowershellCommandParameter("CurrentSecondaryNodeName", CommandParamTypes.string,
        { required: true, options: this.data.nodes.collection.map(node => node.name), allowCustomValAndOptions: true });
      
      const newSecondReplica = new PowershellCommandParameter("NewSecondaryNodeName", CommandParamTypes.string,
        { required: true, options: this.data.nodes.collection.map(node => node.name), allowCustomValAndOptions: true });
      
      
      const moveSecondReplicaSpecific = new PowershellCommand(
        "Move Secondary Replica To Specifc Node",
        'https://docs.microsoft.com/powershell/module/servicefabric/move-servicefabricsecondaryreplica',
        CommandSafetyLevel.safe,
        `Move-ServiceFabricSecondaryReplica -ServiceName ${this.partition.parent.name} -PartitionId ${this.partitionId}`,
        [currSecondReplica, newSecondReplica, ignoreConstraints, timeoutSec]
      )
      this.commands.push(moveSecondReplicaSpecific);
  
      const moveSecondReplicaRandom = new PowershellCommand(
        "Move Secondary Replica To Random Node",
        'https://docs.microsoft.com/powershell/module/servicefabric/move-servicefabricsecondaryreplica',
        CommandSafetyLevel.safe,
        `Move-ServiceFabricSecondaryReplica -ServiceName ${this.partition.parent.name} -PartitionId ${this.partitionId}`,
        [ignoreConstraints, timeoutSec]
      )
      this.commands.push(moveSecondReplicaRandom);
    }
  }
}
