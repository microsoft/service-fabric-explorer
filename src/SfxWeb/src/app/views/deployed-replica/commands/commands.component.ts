import { Component, Injector } from '@angular/core';
import { PowershellCommandParameter, CommandParamTypes, PowershellCommand, CommandSafetyLevel } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { DeployedReplicaBaseControllerDirective } from '../DeployedReplicaBase';

@Component({
  selector: 'app-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends DeployedReplicaBaseControllerDirective {


  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  commands: PowershellCommand[] = [];
  afterDataSet(): void {
    this.setUpCommands();
  }

  setUpCommands() {
    const timeoutSec = new PowershellCommandParameter("TimeoutSec", CommandParamTypes.number);
    
    const getReplica = new PowershellCommand(
      "Get Deployed Replica",
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricdeployedreplica',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricDeployedReplica -NodeName "${this.nodeName}" -ApplicationName ${this.replica.parent.parent.name} -ServiceManifestName ${this.replica.parent.name} -PartitionId ${this.partitionId}`,
      [timeoutSec]
    );
    
    this.commands.push(getReplica);
  }
}
