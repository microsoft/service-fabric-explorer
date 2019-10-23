import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RoutesService {

  private _forceSingleEncode: boolean = false;

  constructor(public location: Location, public routing: Router) { }

  public navigate(pathGetter: () => string): void {
      let path: string;

      try {
          this.forceSingleEncode(true);
          path = pathGetter();
      } finally {
          this.forceSingleEncode(false);
      }

      console.log(path);
      this.routing.navigate([path]);

    //   setTimeout(() => {
    //     this.location.go(path.substring(1))
    //   }, 0, 1);
  }

  // public getTabViewPath(baseViewPath: string, tabId: string): string {
  //     return _.trimEnd(baseViewPath, "/") + "/tab/" + tabId;
  // }

  public getClusterViewPath(): string {
      return "/";
  }

  public getNodesViewPath(): string {
      return "/nodes";
  }

  public getSystemAppsViewPath(): string {
      return "/system/apps";
  }

  public getAppsViewPath(): string {
      return "/apps";
  }

  public getAppTypesViewPath(): string {
      return "/appTypes";
  }

  public getNodeViewPath(nodeName: string): string {
      return "/node/" + this.doubleEncode(nodeName);
  }

  public getNetworksViewPath(): string {
      return "/networks";
  }

  public getNetworkViewPath(networkName: string): string {
      return "/network/" + this.doubleEncode(networkName);
  }

  public getDeployedAppViewPath(nodeName: string, appId: string): string {
      return "/node/" + this.doubleEncode(nodeName) + "/deployedapp/" + this.doubleEncode(appId);
  }

  public getDeployedServiceViewPath(nodeName: string, appId: string, serviceId: string, activationId: string): string {
      return "/node/" + this.doubleEncode(nodeName) + "/deployedapp/" + this.doubleEncode(appId) +
          "/deployedservice/" + this.doubleEncode(serviceId) +
          (activationId ? "/activationid/" + this.doubleEncode(activationId) : "");
  }

  public getDeployedReplicasViewPath(nodeName: string, appId: string, serviceId: string, activationId: string): string {
      return "/node/" + this.doubleEncode(nodeName) + "/deployedapp/" + this.doubleEncode(appId) +
          "/deployedservice/" + this.doubleEncode(serviceId) +
          (activationId ? "/activationid/" + this.doubleEncode(activationId) : "") +
          "/replicas/";
  }

  public getDeployedCodePackagesViewPath(nodeName: string, appId: string, serviceId: string, activationId: string): string {
      return "/node/" + this.doubleEncode(nodeName) + "/deployedapp/" + this.doubleEncode(appId) +
          "/deployedservice/" + this.doubleEncode(serviceId) +
          (activationId ? "/activationid/" + this.doubleEncode(activationId) : "") +
          "/codepackages/";
  }

  public getDeployedReplicaViewPath(nodeName: string, appId: string, serviceId: string, activationId: string, partitionId: string, replicaId: string): string {
      // A partition with a node/app/service is enough to uniquely identify a Replica.  A replicaId is NOT enough to identify a replica.  However, the replicaId is still used in displaying information.
      return "/node/" + this.doubleEncode(nodeName) + "/deployedapp/" + this.doubleEncode(appId) +
          "/deployedservice/" + this.doubleEncode(serviceId) +
          (activationId ? "/activationid/" + this.doubleEncode(activationId) : "") +
          "/partition/" + this.doubleEncode(partitionId) +
          "/replica/" + this.doubleEncode(replicaId);
  }

  public getCodePackageViewPath(nodeName: string, appId: string, serviceId: string, activationId: string, codePackageName: string): string {
      return "/node/" + this.doubleEncode(nodeName) + "/deployedapp/" + this.doubleEncode(appId) +
          "/deployedservice/" + this.doubleEncode(serviceId) +
          (activationId ? "/activationid/" + this.doubleEncode(activationId) : "") +
          "/codepackage/" + this.doubleEncode(codePackageName);
  }

  public getAppTypeViewPath(appTypeName: string): string {
      return "/apptype/" + this.doubleEncode(appTypeName);
  }

  public getAppViewPath(appTypeName: string, appId: string): string {
      return "/apptype/" + this.doubleEncode(appTypeName) + "/app/" + this.doubleEncode(appId);
  }

  public getServiceViewPath(appTypeName: string, appId: string, serviceId: string): string {
      return "/apptype/" + this.doubleEncode(appTypeName) + "/app/" + this.doubleEncode(appId) + "/service/" + this.doubleEncode(serviceId);
  }

  public getPartitionViewPath(appTypeName: string, appId: string, serviceId: string, partitionId: string): string {
      return "/apptype/" + this.doubleEncode(appTypeName) + "/app/" + this.doubleEncode(appId) + "/service/" + this.doubleEncode(serviceId) +
          "/partition/" + this.doubleEncode(partitionId);
  }

  public getReplicaViewPath(appTypeName: string, appId: string, serviceId: string, partitionId: string, replicaId: string): string {
      return "/apptype/" + this.doubleEncode(appTypeName) + "/app/" + this.doubleEncode(appId) + "/service/" + this.doubleEncode(serviceId) +
          "/partition/" + this.doubleEncode(partitionId) + "/replica/" + this.doubleEncode(replicaId);
  }

  // Double encode may be necessary because the browser automatically decodes the token before we have access to it
  public doubleEncode(str: string): string {
      return this._forceSingleEncode ? encodeURIComponent(str) : encodeURIComponent(encodeURIComponent(str));
  }

  private forceSingleEncode(force: boolean) {
      this._forceSingleEncode = force;
  }
}
