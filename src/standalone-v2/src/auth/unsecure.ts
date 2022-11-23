import { unsecureClusterAuthType } from '../constants';
import { ClusterManager } from '../cluster-manager';
import { BaseHttpHandler, IAuthOption } from '../httpHandler';

export const unsecureAuthOption = (clusterManager: ClusterManager): IAuthOption => {
    return {
        id: unsecureClusterAuthType,
        displayName: "Unsecure",
        getHandler: () => new BaseHttpHandler(clusterManager),
        validators: []
    }
}