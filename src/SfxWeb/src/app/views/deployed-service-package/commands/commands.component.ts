import { Component, Injector } from '@angular/core';
import { CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { DeployedServicePackageBaseControllerDirective } from '../DeployedServicePackage';

@Component({
  selector: 'app-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss']
})
export class CommandsComponent extends DeployedServicePackageBaseControllerDirective{
  
  commands: PowershellCommand[] = [];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
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
        'https://docs.microsoft.com/powershell/module/servicefabric/send-servicefabricdeployedservicepackagehealthreport',
        CommandSafetyLevel.safe,
        `Send-ServiceFabricDeployedServicePackageHealthReport -ApplicationName ${this.servicePackage.parent.name} -ServiceManifestName ${this.servicePackage.name} -NodeName "${this.nodeName}"`,
        [healthState, sourceId, healthProperty, description, ttl, removeWhenExpired, sequenceNum, immediate, timeoutSec]
    );

    this.commands.push(healthReport);

    const healthStateFilter = ["Default", "None", "Ok", "Warning", "Error", "All"];
    
    const considerWarnAsErr = new PowershellCommandParameter("ConsiderWarningAsError", CommandParamTypes.bool);
    const eventsFilter = new PowershellCommandParameter("EventsFilter", CommandParamTypes.enum, { options: healthStateFilter, allowCustomValAndOptions: true });
    const servicePacActivId = new PowershellCommandParameter("ServicePackageActivationId", CommandParamTypes.string);

    const getHealth = new PowershellCommand(
      'Get Deployed Service Health',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricdeployedservicepackagehealth',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricDeployedServicePackageHealth -ApplicationName ${this.servicePackage.parent.name} -ServiceManifestName ${this.servicePackage.name} -NodeName "${this.nodeName}"`,
      [considerWarnAsErr, eventsFilter, servicePacActivId, timeoutSec]
    );

    this.commands.push(getHealth);
  }
}
