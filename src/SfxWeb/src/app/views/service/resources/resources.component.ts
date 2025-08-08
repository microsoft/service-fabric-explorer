import { Component, Injector, OnInit } from '@angular/core';
import { ServiceBaseControllerDirective } from '../ServiceBase';
import { DataService } from 'src/app/services/data.service';
import { IResourceItem } from 'src/app/modules/charts/resources-tile/resources-tile.component';
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
  public static readonly cpuMetricName: string = "servicefabric:/_CpuCores"; 
  public static readonly memMetricName: string = "servicefabric:/_MemoryInMB";

  appManifestParameterCollection: { [key: string]: string } = {};
  servicePackageName: string = "";

  // special values and their meanings for variables below:
  // -1: Unknown. Part of equation could not be resolved because it is stored in a remote location
  //  0: Undefined. Customer didn't define value for this.
  cpuCores: number = 0;
  cpuCoresLimit: number = 0;
  memory: number = 0;
  memoryLimit: number = 0;

  cpuData: IResourceItem[] = [];
  memoryData: IResourceItem[] = [];
  spData: IResourceItem[] = [];

  dynamicCpu: boolean = false;
  dynamicMem: boolean = false;

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    this.clearRG();
    const app = this.service.parent;
    
    return this.data.getServiceType(app.raw.TypeName, app.raw.TypeVersion, this.service.description.raw.ServiceTypeName, true, messageHandler)
        .pipe(mergeMap(serviceType => {
            return serviceType.manifest.refresh(messageHandler).pipe(map(() => {
              this.servicePackageName = this.getServicePackageFromManifest(serviceType.manifest.raw.Manifest);
              app.manifest.refresh(messageHandler).subscribe({
                next: (manifest) => {
                  this.parseSectionInfo(this.data.clusterManifest.raw.Manifest, "DynamicRGMetrics");
                  this.appManifestParameterCollection = this.getAppManifestParameters(manifest.raw.Manifest);
                  this.parseServiceManifestImport(manifest.raw.Manifest);
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

    return parameters;
  }

  parseServiceManifestImport(appmanifest: string) : void {
    let currentManifest = appmanifest;
    
    while (currentManifest != ""){ 
      let smImport  = currentManifest.match(/<ServiceManifestImport>(.*?)<\/ServiceManifestImport>/s);
      if (!smImport || !smImport[1]) break;

      let ind = currentManifest.indexOf("</ServiceManifestImport>");
      currentManifest = currentManifest.substring(ind + "</ServiceManifestImport>".length);
      
      let name = smImport[1].match(/ServiceManifestName=['|"]([^'"]+)['|"]/);
      if (!name) continue;

      if (name[1]==this.servicePackageName) {
        this.parseServicePackageRG(smImport[1]);
        break;
      }
    }
  }

  getServicePackageFromManifest(manifest: string) : string {
    let manifestTagDecl = manifest.substring(0, manifest.indexOf(">"));
    let properties = manifestTagDecl.split(" ");
    let name = "";

    properties.forEach(element => {
      if(element.startsWith("Name")){
        let i1 = element.indexOf('"');
        let i2 = element.lastIndexOf('"');
        name = element.substring(i1+1,i2);
        return;
      }
    });

    return name;
  }

  parseSectionInfo(manifest: string, sectionName: string) : void {
    let match = manifest.match(new RegExp(`<Section\\s+Name="${sectionName}"[^>]*>([\\s\\S]*?)<\\/Section>`));
    if (!match) return;

    let content = match[1];
    while(content.length > 0){
      let keyMatch  = content.match(/Name="([^"]+)"/);
      let valueMatch = content.match(/Value="([^"]+)"/);
      if (!keyMatch || !valueMatch) break;

      if (keyMatch[1] == ResourcesComponent.cpuMetricName) this.dynamicCpu = valueMatch[1] == "True";
      if (keyMatch[1] == ResourcesComponent.memMetricName) this.dynamicMem = valueMatch[1] == "True";
      content = content.substring(content.indexOf("/>")+2);
    }
  }

  parseServicePackageRG(manifest: string) : void {
    let patternMatch = `["']\\[?([^"'\\[\\]]+)\\]?["']`;

    this.cpuCores = this.sumValuesFromTags(manifest, ResourcesComponent.cpuCoresKey, patternMatch);
    this.cpuCoresLimit = this.sumValuesFromTags(manifest, ResourcesComponent.cpuCoresLimitKey, patternMatch);
    this.memory = this.sumValuesFromTags(manifest, ResourcesComponent.memoryKey, patternMatch);
    this.memoryLimit = this.sumValuesFromTags(manifest, ResourcesComponent.memoryLimitKey, patternMatch);

    this.fillDisplayData();
  }

  sumValuesFromTags(input: string, key: string, pattern: string) : number {
    let tempInput = input;
    let sumValue = 0;

    while (tempInput.length > 0){
      let match = tempInput.match(new RegExp(`${key}${pattern}`));
      if (!match) break;

      let val = this.resolveParam(match[1]);
      if (val == -1){
        return -1;
      }
      
      sumValue += val;
      tempInput = tempInput.substring(tempInput.indexOf(key) + key.length);
    }
    return sumValue;
  }

  resolveParam(key: string) : number {
    let keyNum = Number(key);
    if (!isNaN(keyNum)) return keyNum;

    let value = this.appManifestParameterCollection[key];
    let valNum = Number(value);
    if (!isNaN(valNum)) return valNum;

    return -1;
  }

  resolveRGDisplayValue(num: number) : string {
    switch(num){
      case -1:
        return "Unknown";
      case 0:
        return "Undefined";
      default:
        return num.toString();
    }
  }
  
  resolveToolTipInfo(num: number) : string {
    switch(num){
      case -1:
        return "Value could not be displayed. Reason: part of value or complete value is stored on a remote location.";
      case 0:
        return "Value has not been specified by the cluster owner.";
      default:
        return null;
    }
  }

  fillDisplayData() : void {
    let dynamicCpuOn = this.dynamicCpu && this.isServiceExclusiveProcess();
    let dynamicMemoryOn = this.dynamicMem && this.isServiceExclusiveProcess();
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
          displayText: this.resolveRGDisplayValue(this.cpuCores),
          disabled: this.cpuCores <= 0,
          toolTip: this.resolveToolTipInfo(this.cpuCores),
          selectorName: "requested"
      },
      {
          title: "Limit",
          displayText: this.resolveRGDisplayValue(this.cpuCoresLimit),
          disabled: this.cpuCoresLimit <= 0,
          toolTip: this.resolveToolTipInfo(this.cpuCoresLimit),
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
          displayText: this.resolveRGDisplayValue(this.memory),
          disabled: this.memory <= 0,
          toolTip: this.resolveToolTipInfo(this.memory),
          selectorName: "requested"
      },
      {
          title: "Limit",
          displayText: this.resolveRGDisplayValue(this.memoryLimit),
          disabled: this.memoryLimit <= 0,
          toolTip: this.resolveToolTipInfo(this.memoryLimit),
          selectorName: "limit"
      },
      {
        title: "Dynamic load reporting",
        displayText: dynamicMemoryOn ? "ON" : "OFF",
        disabled: !dynamicMemoryOn,
        selectorName: "dynamic",
        toolTip: dynamicMemoryOn ? dynamicLoadInfoText : null
      }
    ];

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
    ];
  }
  
  isServiceExclusiveProcess() : boolean {
    return this.service.description.raw.ServicePackageActivationMode == "ExclusiveProcess";
  }

  clearRG() : void {
    this.cpuCores = 0;
    this.cpuCoresLimit = 0;
    this.memory = 0;
    this.memoryLimit = 0;

    this.dynamicCpu = false;
    this.dynamicMem = false;

    this.cpuData = [];
    this.memoryData = [];
    this.spData = [];
  }

}
