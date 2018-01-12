//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

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

        public static idToName(id: string): string {
            return Constants.FabricPrefix + id;
        }

        public static nameToId(name: string): string {
            if (_.startsWith(name, Constants.FabricPrefix)) {
                return name.substr(Constants.FabricPrefix.length);
            }
            return name;
        }
    }
}
