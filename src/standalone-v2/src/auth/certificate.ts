import { AxiosRequestConfig } from 'axios';
import { promises }  from 'fs';
import { Agent } from 'https';
import { secureClusterAuthType } from '../constants';
import { ClusterManager, ICluster, IClustherAuthCertificate } from '../cluster-manager';
import { BaseHttpHandler, IAuthOption, IHTTPRequestTransformer } from '../httpHandler';
import { minLength, isString, endsWith } from '../mainWindow/validate';
import { X509Certificate } from 'crypto';
import { Logger } from '../logger';
import { NotificationTypes } from '../notificationManager';

export function CertificateHandlerFactory(clusterManager: ClusterManager, logger: Logger): IAuthOption {
    return {
        id: secureClusterAuthType,
        displayName: "Secure",
        getHandler: () => new CertificateHttpHandler(clusterManager, logger),
        validators: [{
            propertyPath: 'certificatePath',
            required: true,
            failQuickly: true,
            validators: [isString, minLength(3), endsWith('.pfx')]
        },
        {
            propertyPath: 'certificatePassword',
            validators: [isString]
        }
    ]
    }
}


export class CertificateHttpHandler extends BaseHttpHandler {
    protected httpsAgent: Agent;

    constructor(clusterManager: ClusterManager, private logger: Logger) {
        super(clusterManager);
    }

    async initialize(cluster: ICluster) {
        let succesful = true;

        this.cluster = cluster;

        const auth = cluster.authentication as IClustherAuthCertificate;
        this.logger.log(NotificationTypes.Info, `Loading certificate for cluster ${cluster.id} with auth type ${this.type}`)

        try {
            let cert = await promises.readFile(auth.certificatePath);

            new X509Certificate(cert)
            
            this.logger.log(NotificationTypes.Info, `Loaded certificate for cluster ${cluster.id} from ${auth.certificatePath}`)

            this.httpsAgent = new Agent({
                rejectUnauthorized: false,
                pfx: cert,
                passphrase: auth.certificatePassword || ""
            })

        } catch (e) {
            console.log(e.toString());
            this.clusterManager.addClusterLogMessage(this.cluster.id, `Failed to load certificate. ${e.toString()}`);
            this.logger.log(NotificationTypes.Error, `Failed to load certificate ${e.toString()}`);

            succesful = false;
        }

        return succesful;
    }

    protected async authenticateRequest(request: AxiosRequestConfig): Promise<AxiosRequestConfig> {
        request.httpsAgent = this.httpsAgent;
        return request;
    }
}