import { DataModelBase } from './Base';
import { IRawDeployedServicePackage, IRawDeployedServicePackageHealth } from '../RawDataTypes';
import { DeployedCodePackageCollection, DeployedReplicaCollection } from './Collections';
import { DataService } from 'src/app/services/data.service';
import { ServiceManifest } from './Service';
import { HealthStateFilterFlags, IDeployedServicePackageHealthStateChunk } from '../HealthChunkRawDataTypes';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { HealthBase } from './HealthEvent';

//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

export class DeployedServicePackage extends DataModelBase<IRawDeployedServicePackage> {
    public deployedCodePackages: DeployedCodePackageCollection;
    public deployedReplicas: DeployedReplicaCollection;
    public health: DeployedServicePackageHealth;
    public manifest: ServiceManifest;

    public constructor(data: DataService, raw: IRawDeployedServicePackage, public parent: DeployedApplication) {
        super(data, raw, parent);

        this.deployedCodePackages = new DeployedCodePackageCollection(this.data, this);
        this.deployedReplicas = new DeployedReplicaCollection(this.data, this);
        this.health = new DeployedServicePackageHealth(this.data, this, HealthStateFilterFlags.Default);
        this.manifest = new ServiceManifest(this.data, this);
    }

    public get servicePackageActivationId(): string {
        return this.raw.ServicePackageActivationId;
    }

    public get uniqueId(): string {
        return IdGenerator.deployedServicePackage(this.name, this.servicePackageActivationId);
    }

    public get viewPath(): string {
        return this.data.routes.getDeployedServiceViewPath(this.parent.parent.name, this.parent.id, this.id, this.servicePackageActivationId);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawDeployedServicePackage> {
        return this.data.restClient.getDeployedServicePackage(this.parent.parent.name, this.parent.id, this.name, messageHandler)
            .then(response => {
                return this.servicePackageActivationId
                    ? _.find(response.data, item => this.servicePackageActivationId === item.ServicePackageActivationId)
                    : _.first(response.data);
            });
    }

    protected refreshFromHealthChunkInternal(healthChunk: IDeployedServicePackageHealthStateChunk): angular.IPromise<any> {
        return this.health.mergeHealthStateChunk(healthChunk);
    }
}

export class DeployedServicePackageHealth extends HealthBase<IRawDeployedServicePackageHealth> {
    public constructor(data: DataService, public parent: DeployedServicePackage, protected eventsHealthStateFilter: HealthStateFilterFlags) {
        super(data, parent);
    }

    public get servicePackageActivationId(): string {
        return this.parent.servicePackageActivationId;
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
        return Utils.getHttpResponseData(this.data.restClient.getDeployedServicePackageHealth(this.parent.parent.parent.name, this.parent.parent.id,
            this.parent.name, this.servicePackageActivationId, this.eventsHealthStateFilter, messageHandler));
    }
}


