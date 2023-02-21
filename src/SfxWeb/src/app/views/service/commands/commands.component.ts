import { Component, Injector } from '@angular/core';
import { CommandFactory, CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { ServiceBaseControllerDirective } from '../ServiceBase';

@Component({
  selector: 'app-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends ServiceBaseControllerDirective {
  
  commands: PowershellCommand[] = [];
  
  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  afterDataSet(): void {
    this.setUpCommands();
  }

  private setUpCommands() {

    const healthReport = CommandFactory.GenSendHealthReport("Service", `-ServiceName ${this.service?.name}`);
    this.commands.push(healthReport);

    const considerWarnAsErr = new PowershellCommandParameter("ConsiderWarningAsError", CommandParamTypes.bool);
    const maxPercUnhealthPart = new PowershellCommandParameter("MaxPercentUnhealthyPartitionsperService", CommandParamTypes.number);
    const maxPercUnhealthRep = new PowershellCommandParameter("MaxPercentUnhealthyReplicasPerPartition", CommandParamTypes.number);
    const eventsFilter = CommandFactory.GenHealthFilterParam("Events");
    const partitionsFilter = CommandFactory.GenHealthFilterParam("Partitions");
    const excludeHealthStat = new PowershellCommandParameter("ExcludeHealthStatistics", CommandParamTypes.switch);

    const getHealth = new PowershellCommand(
      'Get Service Health',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricservicehealth',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricServiceHealth -ServiceName ${this.service?.name}`,
      [eventsFilter, partitionsFilter, maxPercUnhealthPart, maxPercUnhealthRep, excludeHealthStat, considerWarnAsErr, CommandFactory.GenTimeoutSecParam()]
    );

    this.commands.push(getHealth);

    const getService = new PowershellCommand(
      'Get Service',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricservice',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricService -ApplicationName ${this.service?.parent.name} -ServiceName ${this.service.name}`,
      [CommandFactory.GenTimeoutSecParam()]
    )

    this.commands.push(getService);

    const getPartitions = new PowershellCommand(
      "Get Partitions",
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricpartition',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricPartition -ServiceName ${this.service?.name}`,
      [CommandFactory.GenTimeoutSecParam()]
    )
    this.commands.push(getPartitions);
    this.commands = [...this.commands];
  }
}
