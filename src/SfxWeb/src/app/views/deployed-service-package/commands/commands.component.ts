import { Component, Injector } from '@angular/core';
import { CommandFactory, CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
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

    const healthReport = CommandFactory.GenSendHealthReport("DeployedServicePackage", `-ApplicationName ${this.servicePackage.parent.name} -ServiceManifestName ${this.servicePackage.name} -NodeName "${this.nodeName}"`);
    this.commands.push(healthReport);
    
    const considerWarnAsErr = new PowershellCommandParameter("ConsiderWarningAsError", CommandParamTypes.bool);
    const eventsFilter = CommandFactory.GenHealthFilterParam("Events");
    const servicePacActivId = this.servicePackage.raw.ServicePackageActivationId;

    const getHealth = new PowershellCommand(
      'Get Deployed Service Health',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricdeployedservicepackagehealth',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricDeployedServicePackageHealth -ApplicationName ${this.servicePackage.parent.name} -ServiceManifestName ${this.servicePackage.name} -NodeName "${this.nodeName}" ${servicePacActivId ? "-ServicePackageActivationId " + servicePacActivId : ""}`,
      [eventsFilter, considerWarnAsErr, CommandFactory.GenTimeoutSecParam()]
    );

    this.commands.push(getHealth);

    const includeHealthState = new PowershellCommandParameter("IncludeHealthState", CommandParamTypes.switch);
    const getService = new PowershellCommand(
      'Get Deployed Service Package',
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricdeployedservicepackage',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricDeployedServicePackage -NodeName "${this.nodeName}" -ApplicationName ${this.servicePackage.parent.name} -ServiceManifestName "${this.servicePackage.name}"`,
      [includeHealthState, CommandFactory.GenTimeoutSecParam()]
    )
    this.commands.push(getService);

    const getReplica = new PowershellCommand(
      "Get Deployed Replicas",
      'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricdeployedreplica',
      CommandSafetyLevel.safe,
      `Get-ServiceFabricDeployedReplica -NodeName "${this.nodeName}" -ApplicationName ${this.servicePackage.parent.name} -ServiceManifestName ${this.servicePackage.name}`,
      [CommandFactory.GenTimeoutSecParam()]
    );
    
    this.commands.push(getReplica);
    this.commands = [...this.commands];

  }
}
