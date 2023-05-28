import { Component, Injector } from '@angular/core';
import { Command } from 'protractor';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { CommandFactory, CommandParamTypes, CommandSafetyLevel, PowershellCommand, PowershellCommandParameter } from 'src/app/Models/PowershellCommand';
import { DataService } from 'src/app/services/data.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

@Component({
  selector: 'app-commands',
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

    const connectHelp = 'https://docs.microsoft.com/powershell/module/servicefabric/connect-servicefabriccluster';
    const connectionEndpoint = new PowershellCommandParameter("ConnectionEndpoint", CommandParamTypes.string, { required: true, defaultValue: document.location.hostname + ":19000"});
    const storeLocation = new PowershellCommandParameter("StoreLocation", CommandParamTypes.enum, { required: true, defaultValue: "CurrentUser", options: ["CurrentUser", "LocalMachine"]});

    let authType = "-X509Credential ";
    if (this.data.clusterManifest.isAADEnabled) {
      authType = "-AzureActiveDirectory ";
    }

    let certificateProperties = this.data.clusterManifest.certificatesInfo;
    let clientThumbprints = certificateProperties
      .filter(x => x.name === "ClientCertificate" && x.x509FindType !== "FindBySubjectName")
      .map(x => { return x.x509FindValue });
    let clientCommonNames = certificateProperties
      .filter(x => x.name === "ClientCertificate" && x.x509FindType === "FindBySubjectName")
      .map(x => { return x.x509FindValue });
    let clusterThumbprints = certificateProperties
      .filter(x => x.name === "ClusterCertificate" && x.x509FindType !== "FindBySubjectName")
      .map(x => { return x.x509FindValue });
    let clusterCommonNames = certificateProperties
      .filter(x => x.name === "ClusterCertificate" && x.x509FindType === "FindBySubjectName")
      .map(x => { return x.x509FindValue });
    let serverThumbprints = certificateProperties
      .filter(x => x.name === "ServerCertificate" && x.x509FindType !== "FindBySubjectName")
      .map(x => { return x.x509FindValue });
    let serverCommonNames = certificateProperties
      .filter(x => x.name === "ServerCertificate" && x.x509FindType === "FindBySubjectName")
      .map(x => { return x.x509FindValue });

    const serverThumbprint = new PowershellCommandParameter("ServerCertThumbprint", CommandParamTypes.enum, {
      required: true,
      options: [...new Set(serverThumbprints)],
      defaultValue: serverThumbprints[0],
    });
    const findValueThumbprint = new PowershellCommandParameter("FindValue", CommandParamTypes.enum, {
      required: true,
      options: [...new Set(clientThumbprints.concat(clusterThumbprints))],
      defaultValue: clientThumbprints[0]
    });

    const serverCommonName = new PowershellCommandParameter("ServerCommonName", CommandParamTypes.enum, {
      required: true,       
      options: [...new Set(serverCommonNames)],
      defaultValue: serverCommonNames[0],
    });
    const findValueCommonName = new PowershellCommandParameter("FindValue", CommandParamTypes.enum, {
      required: true,
      options: [...new Set(clientCommonNames.concat(clusterCommonNames))],
      defaultValue: clientCommonNames[0]
    });

    if (clientCommonNames.length > 0 || serverCommonNames.length > 0) {
      const connectClusterCommon = new PowershellCommand(
        'Creates a connection to a Service Fabric cluster using certificate common name.',
        connectHelp,
        CommandSafetyLevel.safe,
        `Connect-ServiceFabricCluster ${authType}-StoreName My -FindType FindBySubjectName`,
        [connectionEndpoint, storeLocation, serverCommonName, findValueCommonName, CommandFactory.GenTimeoutSecParam()]
      );
      this.commands.push(connectClusterCommon);
    }

    if (clientThumbprints.length > 0 || serverThumbprints.length > 0) {
      const connectClusterThumbprint = new PowershellCommand(
        'Creates a connection to a Service Fabric cluster using certificate thumbprint.',
        connectHelp,
        CommandSafetyLevel.safe,
        `Connect-ServiceFabricCluster ${authType}-StoreName My -FindType FindByThumbprint`,
        [connectionEndpoint, storeLocation, serverThumbprint, findValueThumbprint, CommandFactory.GenTimeoutSecParam()]
      );
      this.commands.push(connectClusterThumbprint);
    }


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
