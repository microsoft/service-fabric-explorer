import { AxiosRequestConfig } from 'axios';
import { promises }  from 'fs';
import { Agent } from 'https';
import { secureClusterAuthType } from '../constants';
import { ClusterManager, ICluster, IClustherAuthCertificate } from '../cluster-manager';
import { IAuthOption, IHTTPRequestTransformer } from '../httpHandler';

export class CertificateHandler implements IHTTPRequestTransformer {
    private httpsAgent: Agent;
    private cluster: ICluster;

    constructor(private clusterManager: ClusterManager) {

    }

    async initialize(cluster: ICluster) {
        let succesful = true;

        this.cluster = cluster;

        const auth = cluster.authType as IClustherAuthCertificate;

        try {
            let cert = await promises.readFile(auth.certificatePath);

            this.httpsAgent = new Agent({
                rejectUnauthorized: false,
                pfx: cert,
                passphrase: auth.certificatePassword || ""
            })

        } catch (e) {
            this.clusterManager.addClusterLogMessage(this.cluster.id, "Failed to load certificate.");
            succesful = false;
        }

        return succesful;
    }

    async transformRequest(request: AxiosRequestConfig) {
        request.httpsAgent = this.httpsAgent;
        return request;
    }

}

export function CertificateHandlerFactory(clusterManager: ClusterManager): IAuthOption {
    return {
        id: secureClusterAuthType,
        displayName: "Secure",
        getHandler: () => new CertificateHandler(clusterManager)
    }
}