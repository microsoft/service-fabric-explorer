import { Component, Injector } from '@angular/core';
import { CommandFactory, CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { NodeBaseControllerDirective } from '../NodeBase';

@Component({
  selector: 'app-node-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends NodeBaseControllerDirective {
  commands: PowershellCommand[] = [];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  afterDataSet() {
    this.setUpCommands();

  }

  protected setUpCommands(): void {

    this.commands.push(
        new PowershellCommand('Restart Node',
            'https://docs.microsoft.com/powershell/module/servicefabric/restart-servicefabricnode',
            CommandSafetyLevel.unsafe,
            `Restart-ServiceFabricNode -NodeName "${this.nodeName}" -NodeInstanceId ${this.node?.raw.InstanceId}`, [], true)
    );

    const healthReport = CommandFactory.GenSendHealthReport("Node", `-NodeName "${this.nodeName}"`)
    this.commands.push(healthReport);

    const considerWarnAsErr = new PowershellCommandParameter("ConsiderWarningAsError", CommandParamTypes.bool);
    const maxPercUnhealthyNodes = new PowershellCommandParameter("MaxPercentUnhealthyNodes", CommandParamTypes.number);
    const eventsFilter = CommandFactory.GenHealthFilterParam("Events");

    const getHealth = new PowershellCommand(
      'Get Node Health',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricnodehealth',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricNodeHealth -NodeName "${this.nodeName}"`,
      [ eventsFilter, maxPercUnhealthyNodes, considerWarnAsErr, CommandFactory.GenTimeoutSecParam()]
    );

    this.commands.push(getHealth);

    const getNode = new PowershellCommand(
      'Get Node',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricnode',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricNode -NodeName "${this.nodeName}"`,
      [CommandFactory.GenTimeoutSecParam()]
    );
    this.commands.push(getNode);

    const getSinglePage = new PowershellCommandParameter("GetSinglePage", CommandParamTypes.switch);
    const includeHealthState = new PowershellCommandParameter("IncludeHealthState", CommandParamTypes.switch);
    const maxResults = new PowershellCommandParameter("MaxResults", CommandParamTypes.number);

    const getDeployedApp = new PowershellCommand(
      "Get Deployed Applications",
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricdeployedapplication',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricDeployedApplication -NodeName "${this.nodeName}"`,
      [includeHealthState, getSinglePage, maxResults, CommandFactory.GenTimeoutSecParam()]
    );

    this.commands.push(getDeployedApp);
    this.commands = [...this.commands];

  }


}
