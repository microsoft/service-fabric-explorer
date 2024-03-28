import { Component, Injector } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { CommandFactory, CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

@Component({
  selector: 'app-cluster-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends BaseControllerDirective {
  commands: PowershellCommand[] = [];
  hasRepairTask: boolean = true;

  constructor(protected data: DataService, injector: Injector) {
    super(injector);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.data.getClusterManifest().pipe(map((manifest) => {
      if (manifest.isRepairManagerEnabled) {
        return this.data.repairCollection.refresh(messageHandler);
      } else {
        this.hasRepairTask = false;
        return of(null);
      }
    }))
  }

  afterDataSet() {
    this.setUpCommands();
  }


  protected setUpCommands(): void {

    const healthReport = CommandFactory.GenSendHealthReport("Cluster");
    this.commands.push(healthReport);

    const getUpgrade = new PowershellCommand(
      'Get Cluster Upgrade',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricclusterupgrade',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricClusterUpgrade`,
      [CommandFactory.GenTimeoutSecParam()]
    );
    this.commands.push(getUpgrade);


    const appsFilter = CommandFactory.GenHealthFilterParam('Applications');
    const considerWarnAsErr = new PowershellCommandParameter("ConsiderWarningAsError", CommandParamTypes.bool);
    const eventsFilter = CommandFactory.GenHealthFilterParam('Events');
    const excludeHealthStat = new PowershellCommandParameter("ExcludeHealthStatistics", CommandParamTypes.switch);
    const includeSysAppHealthStat = new PowershellCommandParameter("IncludeSystemApplicationHealthStatistics", CommandParamTypes.switch);
    const maxPercUnhealthNodes = new PowershellCommandParameter("MaxPercentUnhealthyNodes", CommandParamTypes.number);
    const nodesFilter = CommandFactory.GenHealthFilterParam('Nodes')

    const getHealth = new PowershellCommand(
      'Get Cluster Health',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricclusterhealth',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricClusterHealth`,
      [appsFilter, eventsFilter, nodesFilter, maxPercUnhealthNodes, includeSysAppHealthStat, excludeHealthStat, considerWarnAsErr, CommandFactory.GenTimeoutSecParam()]
    );
    this.commands.push(getHealth);

    const state = new PowershellCommandParameter("State", CommandParamTypes.enum,
      { options: ['Default', 'Created', 'Claimed', 'Preparing', 'Approved', 'Executing', 'ReadyToExecute', 'Restoring', 'Active', 'Completed', 'All'], allowCustomValAndOptions: true }
    );
    const taskId = new PowershellCommandParameter('TaskId', CommandParamTypes.enum, { options: this.data.repairCollection.collection.map(task => task.id)});

    if (this.hasRepairTask) {
      const getRepairTasks = new PowershellCommand(
        "Get Repair Task",
        "https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricrepairtask",
        CommandSafetyLevel.safe,
        `Get-ServiceFabricRepairTask`,
        [taskId, state, CommandFactory.GenTimeoutSecParam()]
      );
      this.commands.push(getRepairTasks);

    }

    this.commands = [...this.commands];
  }

}
