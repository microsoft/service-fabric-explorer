import { Injectable, Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivationEnd, NavigationEnd, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';

const areEqualArrays = (a: any[], b: any[]) => (
    (a.length === b.length) ?
    a.every( value => b.includes(value) ) : false
);

const objectKeyValuesToList = (obj: any): any[] => {
    return Object.keys(obj).map(key => obj[key]);
};
/*
Routing Service additionally will redirect under certain conditions to continue how the previous SFX experienced worked when viewing similar pages.

i.e if viewing a node and are on the details page and you go to view another node, the expectation is it would redirect to the node details page instead of essentials

This is considered reset when viewing a different entity so viewing node/details then applications then back to node would go to the node default page essentials.

*/
@Injectable({
  providedIn: 'root'
})
export class RoutesService {

  constructor(public location: Location, public routing: Router, private activedRoute: ActivatedRoute) {

    // there can be multiple activationEnd events so we want to grab the last one.
    let lastActivationEnd: ActivationEnd = null;

    this.routing.events.subscribe( event => {
        // given there are multiple activation events we want to get the last one because it will have the activation data for the last child route.
        if (event instanceof ActivationEnd) {
            lastActivationEnd = event;
        }

        // this event signifies the end of finding the right route.
        if (event instanceof NavigationEnd){
            const data = this.getPathData(lastActivationEnd.snapshot);

            // check first if same entity views by comparing first component
            // given all routes are lazy loaded we check if the child routing components are the same.
            if (this.previouslastPaths[0] === data.lastPaths[0]) {
                // check if they are the same entities by comparing url params
                if (!areEqualArrays(objectKeyValuesToList(this.previousParams), objectKeyValuesToList(data.params)) ) {
                    // redirect if the "sub" pages are different
                    if (this.previousPathPostFix !== data.pathPostFix) {
                        if (this.previousPathPostFix.length > 0) {
                            setTimeout( () => { this.routing.navigate([`${decodeURIComponent(event.url)}/${this.previousPathPostFix}`]); }, 1);
                        }
                    }
                }else{
                    this.previousPathPostFix = data.pathPostFix;
                }
            }else {
                this.previousPathPostFix = data.pathPostFix;
            }
            this.previouslastPaths =  data.lastPaths;
            this.previousParams = data.params;
        }
    });
   }

  private static singleEncode = true;

// keep track of previous states to know when we changed
  private previouslastPaths = [];
  private previousParams = {};
  private previousPathPostFix = '';

  public static getClusterViewPath(): string {
      return '/';
  }

  public static getNodesViewPath(): string {
      return '/nodes';
  }

  public static getNodeTypeViewPath(nodeType: string): string {
      return '/node-type/' + this.doubleEncode(nodeType);
  }

  public static getSystemAppsViewPath(): string {
      return '/system/apps';
  }

  public static getAppsViewPath(): string {
      return '/apps';
  }

  public static getAppTypesViewPath(): string {
      return '/appTypes';
  }

  public static getNodeViewPath(nodeName: string): string {
      return '/node/' + this.doubleEncode(nodeName);
  }

  public static getNetworksViewPath(): string {
      return '/networks';
  }

  public static getNetworkViewPath(networkName: string): string {
      return '/network/' + this.doubleEncode(networkName);
  }

  public static getDeployedAppViewPath(nodeName: string, appId: string): string {
      return '/node/' + this.doubleEncode(nodeName) + '/deployedapp/' + this.doubleEncode(appId);
  }

  public static getDeployedServiceViewPath(nodeName: string, appId: string, serviceId: string, activationId: string): string {
      return '/node/' + this.doubleEncode(nodeName) + '/deployedapp/' + this.doubleEncode(appId) +
          '/deployedservice/' + this.doubleEncode(serviceId) +
          (activationId ? '/activationid/' + this.doubleEncode(activationId) : '');
  }

  public static getDeployedReplicasViewPath(nodeName: string, appId: string, serviceId: string, activationId: string): string {
      return '/node/' + this.doubleEncode(nodeName) + '/deployedapp/' + this.doubleEncode(appId) +
          '/deployedservice/' + this.doubleEncode(serviceId) +
          (activationId ? '/activationid/' + this.doubleEncode(activationId) : '') +
          '/replicas/';
  }

  public static getDeployedCodePackagesViewPath(nodeName: string, appId: string, serviceId: string, activationId: string): string {
      return '/node/' + this.doubleEncode(nodeName) + '/deployedapp/' + this.doubleEncode(appId) +
          '/deployedservice/' + this.doubleEncode(serviceId) +
          (activationId ? '/activationid/' + this.doubleEncode(activationId) : '') +
          '/codepackages/';
  }

  public static getDeployedReplicaViewPath(nodeName: string, appId: string, serviceId: string, activationId: string, partitionId: string, replicaId: string): string {
      // A partition with a node/app/service is enough to uniquely identify a Replica.
      // A replicaId is NOT enough to identify a replica.  However, the replicaId is still used in displaying information.
      return '/node/' + this.doubleEncode(nodeName) + '/deployedapp/' + this.doubleEncode(appId) +
          '/deployedservice/' + this.doubleEncode(serviceId) +
          (activationId ? '/activationid/' + this.doubleEncode(activationId) : '') +
          '/partition/' + this.doubleEncode(partitionId) +
          '/replica/' + this.doubleEncode(replicaId);
  }

  public static getCodePackageViewPath(nodeName: string, appId: string, serviceId: string, activationId: string, codePackageName: string): string {
      return '/node/' + this.doubleEncode(nodeName) + '/deployedapp/' + this.doubleEncode(appId) +
          '/deployedservice/' + this.doubleEncode(serviceId) +
          (activationId ? '/activationid/' + this.doubleEncode(activationId) : '') +
          '/codepackage/' + this.doubleEncode(codePackageName);
  }

  public static getAppTypeViewPath(appTypeName: string): string {
      return '/apptype/' + this.doubleEncode(appTypeName);
  }

  public static getAppViewPath(appTypeName: string, appId: string): string {
      return '/apptype/' + this.doubleEncode(appTypeName) + '/app/' + this.doubleEncode(appId);
  }

  public static getServiceViewPath(appTypeName: string, appId: string, serviceId: string): string {
      return '/apptype/' + this.doubleEncode(appTypeName) + '/app/' + this.doubleEncode(appId) + '/service/' + this.doubleEncode(serviceId);
  }

  public static getPartitionViewPath(appTypeName: string, appId: string, serviceId: string, partitionId: string): string {
      return '/apptype/' + this.doubleEncode(appTypeName) + '/app/' + this.doubleEncode(appId) + '/service/' + this.doubleEncode(serviceId) +
          '/partition/' + this.doubleEncode(partitionId);
  }

  public static getReplicaViewPath(appTypeName: string, appId: string, serviceId: string, partitionId: string, replicaId: string): string {
      return '/apptype/' + this.doubleEncode(appTypeName) + '/app/' + this.doubleEncode(appId) + '/service/' + this.doubleEncode(serviceId) +
          '/partition/' + this.doubleEncode(partitionId) + '/replica/' + this.doubleEncode(replicaId);
  }

  // Double encode may be necessary because the browser automatically decodes the token before we have access to it
  public static doubleEncode(str: string): string {
      return RoutesService.singleEncode ? encodeURIComponent(str) : encodeURIComponent(encodeURIComponent(str));
  }

  private static forceSingleEncode(force: boolean) {
    RoutesService.singleEncode = force;
  }

   getPathData(snapshot: ActivatedRouteSnapshot): { params: {}, pathPostFix: string, lastPaths: Component[] } {
    const data = {
        params: snapshot.params,
        pathPostFix: '',
        lastPaths: []
    };

    while (snapshot !== null) {
        data.pathPostFix = snapshot.routeConfig.path;
        if (snapshot.component) {
            data.lastPaths.push(snapshot.component);
        }
        snapshot = snapshot.firstChild;
    }
    return data;
   }

  public navigate(pathGetter: () => string): void {
      let path: string;

      try {
          RoutesService.forceSingleEncode(true);
          path = pathGetter();
      } finally {
      }
      this.routing.navigate([path]);
  }
}
