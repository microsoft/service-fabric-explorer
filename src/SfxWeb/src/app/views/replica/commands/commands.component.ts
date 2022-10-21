import { Component, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { ReplicaBaseControllerDirective } from '../ReplicaBase';

@Component({
  selector: 'app-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends ReplicaBaseControllerDirective{
  
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
        'https://docs.microsoft.com/powershell/module/servicefabric/send-servicefabricreplicahealthreport',
        CommandSafetyLevel.unsafe,
        `Send-ServiceFabricReplicaHealthReport -PartitionId ${this.partitionId} -ReplicaId ${this.replicaId}`,
        [healthState, sourceId, healthProperty, description, ttl, removeWhenExpired, sequenceNum, immediate, timeoutSec]
    );

    this.commands.push(healthReport);

    const considerWarningAsErr = new PowershellCommandParameter("ConsiderWarningAsError", CommandParamTypes.bool);
    const eventsFilter = new PowershellCommandParameter("EventsFilter", CommandParamTypes.enum, { options: ["Default", "None", "Ok", "Warning", "Error", "All"], allowCustomValAndOptions: true });

    const getHealth = new PowershellCommand(
      'Get Replica Health',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricreplicahealth',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricReplicaHealth -PartitionId ${this.partitionId} -ReplicaOrInstanceId ${this.replicaId}`,
      [considerWarningAsErr, eventsFilter, timeoutSec]
    );
    this.commands.push(getHealth);

    const getReplica = new PowershellCommand(
      'Get Replica',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricreplica',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricReplica -PartitionId ${this.partitionId} -ReplicaOrInstanceId ${this.replicaId}`,
      [timeoutSec]
    );
    this.commands.push(getReplica);

    if (!this.replica.isStatefulService) {
      const currInstance = new PowershellCommandParameter("CurrentInstanceNodeName ", CommandParamTypes.string,
        { required: true, options: this.data.nodes.collection.map(node => node.name), allowCustomValAndOptions: true });
      const newInstance = new PowershellCommandParameter("NewInstanceNodeName", CommandParamTypes.string,
        { required: true, options: this.data.nodes.collection.map(node => node.name), allowCustomValAndOptions: true });
      const ignoreConstraints = new PowershellCommandParameter('IgnoreConstraints', CommandParamTypes.switch);
      
      
      const moveInstance = new PowershellCommand(
        "Move Instance",
        'https://docs.microsoft.com/powershell/module/servicefabric/move-servicefabricinstance',
        CommandSafetyLevel.safe,
        `Move-ServiceFabricInstance -ServiceName ${this.replica.parent.parent.name} -PartitionId ${this.partitionId}`,
        [currInstance, newInstance, ignoreConstraints, timeoutSec]
      )
      this.commands.push(moveInstance);  
    }
    else {

      const completionMode = new PowershellCommandParameter("CommandCompletionMode", CommandParamTypes.enum, { options: ['Invalid', 'DoNotVerify', 'Verify'] });
      const restartReplica = new PowershellCommand(
        "Restart Replica",
        'https://docs.microsoft.com/powershell/module/servicefabric/restart-servicefabricreplica',
        CommandSafetyLevel.safe,
        `Restart-ServiceFabricReplica -ServiceName ${this.replica.parent.parent.name} -PartitionId ${this.partitionId} -ReplicaOrInstanceId ${this.replicaId}`,
        [completionMode, timeoutSec]
      )
      this.commands.push(restartReplica);
    }
  }
}
