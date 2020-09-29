// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

/**
 * Generate unique Id for fabric entity
 */
export class IdGenerator {

    public static cluster(): string {
        return '<cluster>';
    }

    public static appGroup(): string {
        return '<app group>';
    }

    public static nodeGroup(): string {
        return '<node group>';
    }

    public static networkGroup(): string {
        return '<network group>';
    }

    public static network(networkName: string): string {
        return networkName;
    }

    public static node(nodeName: string): string {
        return nodeName;
    }

    public static app(appId: string): string {
        return appId;
    }

    public static systemAppGroup(): string {
        return '<system app group>';
    }

    public static appType(appTypeName: string): string {
        return appTypeName;
    }

    public static service(serviceId: string): string {
        return serviceId;
    }

    public static partition(partitionId: string): string {
        return partitionId;
    }

    public static replica(replicaId: string): string {
        return replicaId;
    }

    public static deployedApp(appId: string): string {
        return appId;
    }

    public static deployedServicePackage(serviceId: string, servicePackageActivationId: string): string {
        if (servicePackageActivationId) {
            return `${serviceId} (${servicePackageActivationId})`;
        }
        return serviceId;
    }

    public static deployedCodePackageGroup(): string {
        return '<deployed code package group>';
    }

    public static deployedReplicaGroup(): string {
        return '<deployed replica group>';
    }

    public static deployedCodePackage(codePackageName: string): string {
        return codePackageName;
    }

    public static deployedReplica(partitionId: string): string {
        return partitionId;
    }
}


