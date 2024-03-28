import { Component, Injector } from '@angular/core';
import { PowershellCommandParameter, CommandParamTypes, PowershellCommand, CommandSafetyLevel, CommandFactory } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { DeployedReplicaBaseControllerDirective } from '../DeployedReplicaBase';

@Component({
  selector: 'app-deployed-replica-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends DeployedReplicaBaseControllerDirective {

  commands: PowershellCommand[] = [];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  afterDataSet(): void {
    this.setUpCommands();
  }

  setUpCommands() {

    const getReplica = new PowershellCommand(
      "Get Deployed Replica",
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricdeployedreplica',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricDeployedReplica -NodeName "${this.nodeName}" -ApplicationName ${this.replica.parent.parent.name} -ServiceManifestName ${this.replica.parent.name} -PartitionId ${this.partitionId}`,
      [CommandFactory.GenTimeoutSecParam()]
    );

    this.commands.push(getReplica);
    this.commands = [...this.commands];

  }
}
