import { Component, Injector, OnInit } from '@angular/core';
import { ServiceBaseControllerDirective } from '../ServiceBase';
import { DataService } from 'src/app/services/data.service';
import { IResourceItem } from 'src/app/modules/charts/resources-tile/resources-tile.component';
import { RGMetric } from 'src/app/Models/DataModels/Application';
import { NodeLoadInformation } from 'src/app/Models/DataModels/Node';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { map, mergeMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'service-resources',
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss']
})
export class ResourcesComponent extends ServiceBaseControllerDirective {

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  public static readonly cpuCoresKey: string = "CpuCores=";
  public static readonly cpuCoresLimitKey: string = "CpuCoresLimit=";
  public static readonly memoryKey: string = "MemoryInMB=";
  public static readonly memoryLimitKey: string = "MemoryInMBLimit=";

  appManifestParameterCollection: { [key: string]: string } = {};
  servicePackageName: string = "";
  cpuCores: number = 0;
  cpuCoresLimit: number = 0;
  memory: number = 0;
  memoryLimit: number = 0;

  cpuData: IResourceItem[] = [];
  memoryData: IResourceItem[] = [];
  spData: IResourceItem[] = [];
  // note: string = "";

  dynamicMetric: RGMetric = RGMetric.CPU; //kako dohvatiti koja je ukljucena? + disclaimer

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    const app = this.service.parent;
    
    return this.data.getServiceType(app.raw.TypeName, app.raw.TypeVersion, this.service.description.raw.ServiceTypeName, true, messageHandler)
        .pipe(mergeMap(serviceType => {
            return serviceType.manifest.refresh(messageHandler).pipe(map(() => {

              this.servicePackageName = this.getServicePackageFromManifest(serviceType.manifest.raw.Manifest);
              app.manifest.refresh(messageHandler).subscribe({
                next: (manifest) => {
//                   let m = `
//     <?xml version='1.0' encoding='UTF-8'?>
// <ApplicationManifest ApplicationTypeName='TestAppTC1' ApplicationTypeVersion='vTC1' xsi:schemaLocation='http://schemas.microsoft.com/2011/01/fabric ServiceFabricServiceModel.xsd' xmlns='http://schemas.microsoft.com/2011/01/fabric' xmlns:xsi='https://www.w3.org/2001/XMLSchema-instance'>

//   <Parameters>
//     <Parameter Name="CpuCores" DefaultValue="4" />
//     <Parameter Name="CpuSharesA" DefaultValue="512" />
//     <Parameter Name="CpuSharesB" DefaultValue="512" />
//     <Parameter Name="MemoryA" DefaultValue="1000" />
//     <Parameter Name="MemoryB" DefaultValue="100" />
//     <Parameter Name="MemoryC" DefaultValue="10" />
//   </Parameters>
//   <ServiceManifestImport>
//     <ServiceManifestRef ServiceManifestName='SP3' ServiceManifestVersion='v1'/>
//     <Policies>
//       <ServicePackageResourceGovernancePolicy CpuCores="[CpuCores]"/>
//       <ResourceGovernancePolicy CodePackageRef="CodeA1" CpuShares="[CpuSharesA]" MemoryInMB="[MemoryA]"/>
//       <ResourceGovernancePolicy CodePackageRef="CodeA2" CpuShares="[CpuSharesB]" MemoryInMB="[MemoryB]" />
//     </Policies>
//   </ServiceManifestImport>
  
//   <ServiceManifestImport>
//     <ServiceManifestRef ServiceManifestName='SP2' ServiceManifestVersion='v1'/>
//     <Policies>
//       <ServicePackageResourceGovernancePolicy CpuCores="[CpuCores]"/>
//       <ResourceGovernancePolicy CodePackageRef="CodeA1" CpuShares="[CpuSharesA]" MemoryInMB="[MemoryA]" />
//       <ResourceGovernancePolicy CodePackageRef="CodeA2" CpuShares="[CpuSharesB]" MemoryInMB="[MemoryB]" />
//     </Policies>
//   </ServiceManifestImport>
//   <ServiceManifestImport>
//     <ServiceManifestRef ServiceManifestName='SP1' ServiceManifestVersion='v1'/>
//     <Policies>
//       <ServicePackageResourceGovernancePolicy CpuCores="[CpuCores]" CpuCoresLimit="12"/>
//       <ResourceGovernancePolicy CodePackageRef="CodeA1" CpuShares="[CpuSharesA]" MemoryInMB="[MemoryA]"  MemoryInMBLimit="1000"/>
//       <ResourceGovernancePolicy CodePackageRef="CodeA2" CpuShares="[CpuSharesB]" MemoryInMB="[MemoryB]" MemoryInMBLimit="[MemoryC]"/>
//       <ResourceGovernancePolicy CodePackageRef="CodeA2" CpuShares="[CpuSharesB]" MemoryInMBLimit="[MemoryC]" MemoryInMB="[MemoryB]"/>
//     </Policies>
//   </ServiceManifestImport>
//     `;

//                   this.appManifestParameterCollection = this.getAppManifestParameters(m);
//                   this.getServiceManifestImport(m);
                  this.appManifestParameterCollection = this.getAppManifestParameters(manifest.raw.Manifest);
                  this.getServiceManifestImport(manifest.raw.Manifest);
                }
              });

            }));
        }));
  }

  getAppManifestParameters(manifest: string) : { [key: string]: string }  {
    let parameters = {};
    let tagStart = "<Parameters>", tagEnd = "</Parameters>";
    let start = manifest.indexOf(tagStart);
    let end = manifest.indexOf(tagEnd);

    if (start==-1 || end==-1){
      return parameters;
    }

    let content = manifest.substring(start + tagStart.length, end);

    while(content.length > 0){
      let i1 = content.indexOf("<Parameter");
      let i2 = content.indexOf("/>");
      if (i1==-1 || i2==-1) break;
      let row = content.substring(i1,i2);

      let name  = row.match(/Name="([^"]+)"/);
      let value = row.match(/DefaultValue="([^"]+)"/);
      if (name && value) {
        parameters[name[1]]=value[1];
      }
      content = content.substring(i2+1);
    }

    console.log(parameters);
    return parameters;
  }

  getServiceManifestImport(appmanifest: string){
    let currentManifest = appmanifest;
    
    while (currentManifest != ""){ 
      let smImport  = currentManifest.match(/<ServiceManifestImport>(.*?)<\/ServiceManifestImport>/s);
      if (!smImport || !smImport[1]) break;

      let ind = currentManifest.indexOf("</ServiceManifestImport>");
      currentManifest = currentManifest.substring(ind + "</ServiceManifestImport>".length);
      
      let name = smImport[1].match(/ServiceManifestName=['|"]([^'"]+)['|"]/);
      if (!name) continue;

      if (name[1]==this.servicePackageName) {
        this.parseServiceManifestImport(smImport[1]);
        break;
      }
    }
  }

  getServicePackageFromManifest(manifest: string): string{
    let manifestTagDecl = manifest.substring(0, manifest.indexOf(">"));
    let properties = manifestTagDecl.split(" ");
    let name = "";

    properties.forEach(element => {
      if(element.startsWith("Name")){
        let i1 = element.indexOf('"');
        let i2 = element.lastIndexOf('"');
        console.log(element.substring(i1+1,i2));
        name = element.substring(i1+1,i2);
        return;
      }
    });

    return name;
  }

  parseServiceManifestImport(manifest: string){
    this.clearRG();
    console.log("CREATING MANIFEST IMPORT");
    let patternMatch = `["']\\[?([^"'\\[\\]]+)\\]?["']`;
    let cpuCoresMatch = manifest.match(new RegExp(`${ResourcesComponent.cpuCoresKey}${patternMatch}`));
    if (cpuCoresMatch) this.cpuCores = this.resolveParam(cpuCoresMatch[1]);
    
    let cpuCoresLimitMatch = manifest.match(new RegExp(`${ResourcesComponent.cpuCoresLimitKey}${patternMatch}`));
    if (cpuCoresLimitMatch) this.cpuCoresLimit = this.resolveParam(cpuCoresLimitMatch[1]);

    let tempInput = manifest;
    while (tempInput.length > 0){
      let memoryMatch = tempInput.match(new RegExp(`${ResourcesComponent.memoryKey}${patternMatch}`));
      if (!memoryMatch) break;

      this.memory += this.resolveParam(memoryMatch[1]);
      let ind = tempInput.indexOf(ResourcesComponent.memoryKey+"");
      tempInput = tempInput.substring(ind + ResourcesComponent.memoryKey.length);
    }
    
    tempInput = manifest;
    while (tempInput.length > 0){
      let memoryLimitMatch = tempInput.match(new RegExp(`${ResourcesComponent.memoryLimitKey}${patternMatch}`));
      if (!memoryLimitMatch) break;

      this.memoryLimit += this.resolveParam(memoryLimitMatch[1]);
      let ind = tempInput.indexOf(ResourcesComponent.memoryLimitKey);
      tempInput = tempInput.substring(ind + ResourcesComponent.memoryLimitKey.length);
    }

    this.fillDisplayData();
  }

  clearRG(){
    this.cpuCores = 0;
    this.cpuCoresLimit = 0;
    this.memory = 0;
    this.memoryLimit = 0;
  }

  resolveParam(key: string) : number {
    console.log("resolving: "+ key);
    let value = this.appManifestParameterCollection[key];
    if (!value) return Number(key);

    let valNum = Number(value);
    if (isNaN(valNum)) return 0;

    return valNum;
  }

  fillDisplayData() {
    let dynamicCpuOn = this.dynamicMetric == RGMetric.CPU && this.isServiceExclusiveProcess();
    // let dynamicMemoryOn = this.dynamicMetric == RGMetric.Memory && this.isServiceExclusiveProcess();
    let dynamicMemoryOn = true;
    let dynamicLoadInfoText = "You can see values of dynamically reported loads in Partition View - Replicas/Instances table.";

    this.cpuData = [
      {
          title: "CPU",
          displayText: "[cores]",
          selectorName: "measure",
          isTitle: true
      },
      {
          title: "Requested",
          displayText: this.cpuCores ? this.cpuCores.toString() : "Undefined",
          disabled: this.cpuCores == 0,
          selectorName: "requested"
      },
      {
          title: "Limit",
          displayText: this.cpuCoresLimit ? this.cpuCoresLimit.toString() : "Undefined",
          disabled: this.cpuCoresLimit == 0,
          selectorName: "limit"
      },
      {
        title: "Dynamic load reporting",
        displayText: dynamicCpuOn ? "ON" : "OFF",
        disabled: !dynamicCpuOn,
        selectorName: "dynamic",
        toolTip: dynamicCpuOn ? dynamicLoadInfoText : null
      }
    ];
    
    this.memoryData = [
      {
          title: "Memory",
          displayText: "[MB]",
          selectorName: "measure",
          isTitle: true
      },
      {
          title: "Requested",
          displayText: this.memory ? this.memory.toString() : "Undefined",
          disabled: this.memory == 0,
          selectorName: "requested"
      },
      {
          title: "Limit",
          displayText: this.memoryLimit ? this.memoryLimit.toString() : "Undefined",
          disabled: this.memoryLimit == 0,
          selectorName: "limit"
      },
      {
        title: "Dynamic load reporting",
        displayText: dynamicMemoryOn ? "ON" : "OFF",
        disabled: !dynamicMemoryOn,
        selectorName: "dynamic",
        toolTip: dynamicMemoryOn ? dynamicLoadInfoText : null
      }
    ]

    this.spData = [
      {
        title: "Service package info",
        isTitle: true
      },
      {
        title: "Name",
        displayText: this.servicePackageName
      },
      {
        title: "Service package activation mode",
        displayText: this.service.description.raw.ServicePackageActivationMode,
        toolTip: "Dynamic load reporting is available only for services with ExclusiveProcess service package activation mode."
      },
      {
        title: "Dynamic load reporting supported",
        displayText: this.isServiceExclusiveProcess() ? "Yes" : "No"
      }
    ]
  }
  
  isServiceExclusiveProcess() : boolean
  {
    return this.service.description.raw.ServicePackageActivationMode == "ExclusiveProcess";
  }

  setup() {}
}
