import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RoutesService {

  private static _forceSingleEncode: boolean = true;

  constructor(public location: Location, public routing: Router) {

   }

  public navigate(pathGetter: () => string): void {
      let path: string;

      try {
        RoutesService
        .forceSingleEncode(true);
          path = pathGetter();
      } finally {
      }

      console.log(path);
      this.routing.navigate([path]).then(r => console.log(r));
  }

  public static getClusterViewPath(): string {
      return "/";
  }

  public static getNodesViewPath(): string {
      return "/nodes";
  }

  public static getSystemAppsViewPath(): string {
      return "/system/apps";
  }

  public static getAppsViewPath(): string {
      return "/apps";
  }

  public static getAppTypesViewPath(): string {
      return "/appTypes";
  }

  public static getNodeViewPath(nodeName: string): string {
      return "/node/" + this.doubleEncode(nodeName);
  }

  public static getNetworksViewPath(): string {
      return "/networks";
  }

  public static getNetworkViewPath(networkName: string): string {
      return "/network/" + this.doubleEncode(networkName);
  }

  public static getDeployedAppViewPath(nodeName: string, appId: string): string {
      return "/node/" + this.doubleEncode(nodeName) + "/deployedapp/" + this.doubleEncode(appId);
  }

  public static getDeployedServiceViewPath(nodeName: string, appId: string, serviceId: string, activationId: string): string {
      return "/node/" + this.doubleEncode(nodeName) + "/deployedapp/" + this.doubleEncode(appId) +
          "/deployedservice/" + this.doubleEncode(serviceId) +
          (activationId ? "/activationid/" + this.doubleEncode(activationId) : "");
  }

  public static getDeployedReplicasViewPath(nodeName: string, appId: string, serviceId: string, activationId: string): string {
      return "/node/" + this.doubleEncode(nodeName) + "/deployedapp/" + this.doubleEncode(appId) +
          "/deployedservice/" + this.doubleEncode(serviceId) +
          (activationId ? "/activationid/" + this.doubleEncode(activationId) : "") +
          "/replicas/";
  }

  public static getDeployedCodePackagesViewPath(nodeName: string, appId: string, serviceId: string, activationId: string): string {
      return "/node/" + this.doubleEncode(nodeName) + "/deployedapp/" + this.doubleEncode(appId) +
          "/deployedservice/" + this.doubleEncode(serviceId) +
          (activationId ? "/activationid/" + this.doubleEncode(activationId) : "") +
          "/codepackages/";
  }

  public static getDeployedReplicaViewPath(nodeName: string, appId: string, serviceId: string, activationId: string, partitionId: string, replicaId: string): string {
      // A partition with a node/app/service is enough to uniquely identify a Replica.  A replicaId is NOT enough to identify a replica.  However, the replicaId is still used in displaying information.
      return "/node/" + this.doubleEncode(nodeName) + "/deployedapp/" + this.doubleEncode(appId) +
          "/deployedservice/" + this.doubleEncode(serviceId) +
          (activationId ? "/activationid/" + this.doubleEncode(activationId) : "") +
          "/partition/" + this.doubleEncode(partitionId) +
          "/replica/" + this.doubleEncode(replicaId);
  }

  public static getCodePackageViewPath(nodeName: string, appId: string, serviceId: string, activationId: string, codePackageName: string): string {
      return "/node/" + this.doubleEncode(nodeName) + "/deployedapp/" + this.doubleEncode(appId) +
          "/deployedservice/" + this.doubleEncode(serviceId) +
          (activationId ? "/activationid/" + this.doubleEncode(activationId) : "") +
          "/codepackage/" + this.doubleEncode(codePackageName);
  }

  public static getAppTypeViewPath(appTypeName: string): string {
      return "/apptype/" + this.doubleEncode(appTypeName);
  }

  public static getAppViewPath(appTypeName: string, appId: string): string {
      return "/apptype/" + this.doubleEncode(appTypeName) + "/app/" + this.doubleEncode(appId);
  }

  public static getServiceViewPath(appTypeName: string, appId: string, serviceId: string): string {
      return "/apptype/" + this.doubleEncode(appTypeName) + "/app/" + this.doubleEncode(appId) + "/service/" + this.doubleEncode(serviceId);
  }

  public static getPartitionViewPath(appTypeName: string, appId: string, serviceId: string, partitionId: string): string {
      return "/apptype/" + this.doubleEncode(appTypeName) + "/app/" + this.doubleEncode(appId) + "/service/" + this.doubleEncode(serviceId) +
          "/partition/" + this.doubleEncode(partitionId);
  }

  public static getReplicaViewPath(appTypeName: string, appId: string, serviceId: string, partitionId: string, replicaId: string): string {
      return "/apptype/" + this.doubleEncode(appTypeName) + "/app/" + this.doubleEncode(appId) + "/service/" + this.doubleEncode(serviceId) +
          "/partition/" + this.doubleEncode(partitionId) + "/replica/" + this.doubleEncode(replicaId);
  }

  // Double encode may be necessary because the browser automatically decodes the token before we have access to it
  public static doubleEncode(str: string): string {
      return this._forceSingleEncode ? encodeURIComponent(str) : encodeURIComponent(encodeURIComponent(str));
  }

  private static forceSingleEncode(force: boolean) {
      this._forceSingleEncode = force;
  }
}
