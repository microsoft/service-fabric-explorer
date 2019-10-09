import { Constants } from '../Common/Constants';

//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

export class IdUtils {
    public static getAppId(routeParams: any): string {
        return decodeURIComponent(routeParams.appId);
    }

    public static getPartitionId(routeParams: any): string {
        return decodeURIComponent(routeParams.partitionId);
    }

    public static getReplicaId(routeParams: any): string {
        return decodeURIComponent(routeParams.replicaId);
    }

    public static getServiceId(routeParams: any): string {
        return decodeURIComponent(routeParams.serviceId);
    }

    public static getServicePackageActivationId(routeParams: any): string {
        return routeParams.activationId ? decodeURIComponent(routeParams.activationId) : "";
    }

    public static getAppTypeName(routeParams: any): string {
        return decodeURIComponent(routeParams.appTypeName);
    }

    public static getCodePackageName(routeParams: any): string {
        return decodeURIComponent(routeParams.codePackageName);
    }

    public static getContainerLogs(routeParams: any): string {
        return decodeURIComponent(routeParams.codePackageName);
    }

    public static getNodeName(routeParams: any): string {
        return decodeURIComponent(routeParams.nodeName);
    }

    public static getBackupPolicyName(routeParams: any): string {
        return decodeURIComponent(routeParams.backupPolicyName);
    }

    public static getNetworkName(routeParams: any): string {
        return decodeURIComponent(routeParams.networkName);
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

