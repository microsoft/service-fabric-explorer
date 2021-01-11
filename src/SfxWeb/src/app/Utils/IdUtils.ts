import { Constants } from '../Common/Constants';
import { ActivatedRouteSnapshot } from '@angular/router';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export class IdUtils {

    // This traverses the route, following ancestors, looking for the parameter.
    public static getParam(route: ActivatedRouteSnapshot, key: string): any {
      if (route != null) {
        const param = route.params[key];
        if (param === undefined) {
          return IdUtils.getParam(route.parent, key);
        } else {
          return param;
        }
      } else {
        return undefined;
      }
    }

    public static getAppId(route: ActivatedRouteSnapshot): string {
        return decodeURIComponent(IdUtils.getParam(route, 'appId'));
    }

    public static getPartitionId(route: ActivatedRouteSnapshot): string {
        return decodeURIComponent(IdUtils.getParam(route, 'partitionId'));
    }

    public static getReplicaId(route: ActivatedRouteSnapshot): string {
        return decodeURIComponent(IdUtils.getParam(route, 'replicaId'));
    }

    public static getServiceId(route: ActivatedRouteSnapshot): string {
        return decodeURIComponent(IdUtils.getParam(route, 'serviceId'));
    }

    public static getServicePackageActivationId(route: ActivatedRouteSnapshot): string {
        const id = IdUtils.getParam(route, 'activationId');
        return id ? decodeURIComponent(id) : '';
    }

    public static getAppTypeName(route: ActivatedRouteSnapshot): string {
        return decodeURIComponent(IdUtils.getParam(route, 'appTypeName'));
    }

    public static getCodePackageName(route: ActivatedRouteSnapshot): string {
        return decodeURIComponent(IdUtils.getParam(route, 'codePackageName'));
    }

    public static getContainerLogs(route: ActivatedRouteSnapshot): string {
        return decodeURIComponent(IdUtils.getParam(route, 'codePackageName'));
    }

    public static getNodeName(route: ActivatedRouteSnapshot): string {
        return decodeURIComponent(IdUtils.getParam(route, 'nodeName'));
    }

    public static getBackupPolicyName(route: ActivatedRouteSnapshot): string {
        return decodeURIComponent(IdUtils.getParam(route, 'backupPolicyName'));
    }

    public static getNetworkName(route: ActivatedRouteSnapshot): string {
        return decodeURIComponent(IdUtils.getParam(route, 'networkName'));
    }

    public static idToName(id: string): string {
        return Constants.FabricPrefix + id;
    }

    public static nameToId(name: string): string {
        if (name.startsWith(Constants.FabricPrefix)) {
            return name.substr(Constants.FabricPrefix.length);
        }
        return name;
    }
}

