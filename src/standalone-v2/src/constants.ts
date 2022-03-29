export enum MainWindowEvents {
    sendHttpRequest = "sendHttpRequest",
    requestFileDialog = "requestFileDialog",
    
    addCluster = "addCluster",
    removeCluster = "removeCluster",
    reconnectCluster = "reconnectCluster",
    editCluster = "editCluster",
    disconnectCLuster = "disconnectCLuster",
    importCLusters = "importCLusters",

    clusterStatesChange = "clusterStatesChange",
    requestClusterState = "requestClusterState",
}

export const ClusterStateError = "Error";
export const ClusterStateWarning = "Warning";
export const ClusterStateOk = "Ok";

export const unsecureClusterAuthType = "unsecure";
export const secureClusterAuthType = "certificate";
export const aadClusterAuthType = "aad";