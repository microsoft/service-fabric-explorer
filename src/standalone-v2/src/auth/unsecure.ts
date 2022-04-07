import { AxiosRequestConfig } from 'axios';
import { unsecureClusterAuthType } from '../constants';
import { ICluster } from '../cluster-manager';
import { IAuthOption, IHTTPRequestTransformer } from '../httpHandler';

export class UnsecureHttpHandler implements IHTTPRequestTransformer {
    type = unsecureClusterAuthType;
    constructor() {}

    async initialize(cluster: ICluster) {
        return true;
    }

    async transformRequest(request: AxiosRequestConfig) {
        return request;
    }

}

export const unsecureAuthOption: IAuthOption = {
    id: unsecureClusterAuthType,
    displayName: "Unsecure",
    getHandler: () => new UnsecureHttpHandler()
}