import { Component, Injector } from '@angular/core';
import { Observable, of } from 'rxjs';
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
    const removeWhenExpired = new PowershellCommandParameter("RemoveWhenExpired", CommandParamTypes.bool)
    const sequenceNum = new PowershellCommandParameter("SequenceNumber", CommandParamTypes.number);
    const immediate = new PowershellCommandParameter("Immediate", CommandParamTypes.bool);
    const timeoutSec = new PowershellCommandParameter("TimeoutSec", CommandParamTypes.number);
    
    const healthReport = new PowershellCommand(
        'Send Health Report',
        'https://docs.microsoft.com/powershell/module/servicefabric/send-servicefabricnodehealthreport',
        CommandSafetyLevel.dangerous,
        `Send-ServiceFabricNodeHealthReport -NodeName "${this.nodeName}"`,
        [healthState, sourceId, healthProperty, description, ttl, removeWhenExpired, sequenceNum, immediate, timeoutSec]
    );

    this.commands.push(healthReport);
  }


}
