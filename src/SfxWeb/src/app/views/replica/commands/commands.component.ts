import { Component, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { CommandFactory, CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { ReplicaBaseControllerDirective } from '../ReplicaBase';

@Component({
  selector: 'app-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends ReplicaBaseControllerDirective{
  
  commands: PowershellCommand[] = [];
  replicaRole: string;

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    if (this.replicaRole !== this.replica?.raw.ReplicaRole) {
      this.afterDataSet();
    }

    return this.data.getNodes();
  }

  afterDataSet(): void {
    this.replicaRole = this.replica?.raw.ReplicaRole;
    this.setUpCommands();
  }

  private setUpCommands() {
    this.commands = [];

    const healthReport = CommandFactory.GenSendHealthReport("Replica", `-PartitionId ${this.partitionId} -ReplicaId ${this.replicaId}`);
    this.commands.push(healthReport);

    const considerWarningAsErr = new PowershellCommandParameter("ConsiderWarningAsError", CommandParamTypes.bool);
    const eventsFilter = CommandFactory.GenHealthFilterParam("Events");

    const getHealth = new PowershellCommand(
      'Get Replica Health',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricreplicahealth',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricReplicaHealth -PartitionId ${this.partitionId} -ReplicaOrInstanceId ${this.replicaId}`,
      [eventsFilter, considerWarningAsErr, CommandFactory.GenTimeoutSecParam()]
    );
    this.commands.push(getHealth);

    const getReplica = new PowershellCommand(
      'Get Replica',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricreplica',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricReplica -PartitionId ${this.partitionId} -ReplicaOrInstanceId ${this.replicaId}`,
      [CommandFactory.GenTimeoutSecParam()]
    );
    this.commands.push(getReplica);

    if (!this.replica?.isStatefulService) {
      const nodes = this.data.nodes.collection.map(node => node.name);

      const moveInstance = new PowershellCommand(
        "Move Instance",
        'https://docs.microsoft.com/powershell/module/servicefabric/move-servicefabricinstance',
        CommandSafetyLevel.unsafe,
        `Move-ServiceFabricInstance -ServiceName ${this.replica?.parent.parent.name} -PartitionId ${this.partitionId} -CurrentInstanceNodeName ${this.replica?.raw.NodeName}`,
        [CommandFactory.GenNodeListParam("NewInstanceNodeName", nodes), CommandFactory.GenIgnoreConstraintsParam(), CommandFactory.GenTimeoutSecParam()],
        true
      );
      this.commands.push(moveInstance);  
    }
    else {

      const completionMode = new PowershellCommandParameter("CommandCompletionMode", CommandParamTypes.enum, { options: ['Invalid', 'DoNotVerify', 'Verify'] });
      const restartReplica = new PowershellCommand(
        "Restart Replica",
        'https://docs.microsoft.com/powershell/module/servicefabric/restart-servicefabricreplica',
        CommandSafetyLevel.unsafe,
        `Restart-ServiceFabricReplica -ServiceName ${this.replica?.parent.parent.name} -PartitionId ${this.partitionId} -ReplicaOrInstanceId ${this.replicaId}`,
        [completionMode, CommandFactory.GenTimeoutSecParam()], true
      );
      this.commands.push(restartReplica);

      if(this.replicaRole !== 'Primary'){
        const nodes = this.data.nodes.collection.map(node => node.name);

        const moveSecondReplicaSpecific = new PowershellCommand(
          "Move Secondary Replica To Specifc Node",
          'https://docs.microsoft.com/powershell/module/servicefabric/move-servicefabricsecondaryreplica',
          CommandSafetyLevel.unsafe,
          `Move-ServiceFabricSecondaryReplica -ServiceName ${this.replica?.parent.parent.name} -PartitionId ${this.partitionId} -CurrentSecondaryNodeName ${this.replica?.raw.NodeName}`,
          [CommandFactory.GenNodeListParam("NewSecondaryNodeName", nodes),
          CommandFactory.GenIgnoreConstraintsParam(),
          CommandFactory.GenTimeoutSecParam()
          ], true);
        
        this.commands.push(moveSecondReplicaSpecific);
    
        const moveSecondReplicaRandom = new PowershellCommand(
          "Move Secondary Replica To Random Node",
          'https://docs.microsoft.com/powershell/module/servicefabric/move-servicefabricsecondaryreplica',
          CommandSafetyLevel.unsafe,
          `Move-ServiceFabricSecondaryReplica -ServiceName ${this.replica?.parent.parent.name} -PartitionId ${this.partitionId} -CurrentSecondaryNodeName ${this.replica?.raw.NodeName}`,
          [CommandFactory.GenIgnoreConstraintsParam(), CommandFactory.GenTimeoutSecParam()], true
        )
        this.commands.push(moveSecondReplicaRandom);
      }
    }

    if (this.replicaRole === 'IdleSecondary') {
      const removeReplica = new PowershellCommand(
        "Force Remove Replica/Instance",
        'https://docs.microsoft.com/powershell/module/servicefabric/remove-servicefabricreplica',
        CommandSafetyLevel.unsafe,
        `Remove-ServiceFabricReplica -ForceRemove -ServiceName ${this.replica?.parent.parent.name} -ReplicaOrInstanceId ${this.replicaId}`,
        [new PowershellCommandParameter("CommandCompletionMode", CommandParamTypes.enum, { options: ['Invalid', 'DoNotVerify', 'Verify'] }), CommandFactory.GenTimeoutSecParam()], true
      );
      this.commands.push(removeReplica);
    }
    this.commands = [...this.commands];
  }
}
