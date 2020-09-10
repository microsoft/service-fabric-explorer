import { DataModelBase, IDecorators } from './Base';
import { IRawDeployedApplication, IRawApplicationHealth } from '../RawDataTypes';
import { HtmlUtils } from 'src/app/Utils/HtmlUtils';
import { DeployedServicePackageCollection } from './collections/Collections';
import { DataService } from 'src/app/services/data.service';
import { HealthStateFilterFlags, IClusterHealthChunkQueryDescription, IDeployedApplicationHealthStateFilter, IDeployedApplicationHealthStateChunk } from '../HealthChunkRawDataTypes';
import { Node } from './Node';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { HealthBase } from './HealthEvent';
import { RoutesService } from 'src/app/services/routes.service';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export class DeployedApplication extends DataModelBase<IRawDeployedApplication> {
    public decorators: IDecorators = {
        decorators: {
            TypeName: {
                displayValueInHtml: (value) => HtmlUtils.getLinkHtml(value, this.appTypeViewPath)
            }
        }
    };

    public deployedServicePackages: DeployedServicePackageCollection;
    public health: DeployedApplicationHealth;

    public constructor(data: DataService, raw: IRawDeployedApplication, public parent: Node) {
        super(data, raw, parent);

        this.deployedServicePackages = new DeployedServicePackageCollection(this.data, this);
        this.health = new DeployedApplicationHealth(this.data, this, HealthStateFilterFlags.Default, HealthStateFilterFlags.None);
    }

    public get viewPath(): string {
        return RoutesService.getDeployedAppViewPath(this.parent.name, this.id);
    }

    public get appTypeViewPath(): string {
        return RoutesService.getAppTypeViewPath(this.raw.TypeName);
    }

    public get diskLocation(): string {
        if (this.raw.WorkDirectory) {
            return this.raw.WorkDirectory.substring(0, this.raw.WorkDirectory.lastIndexOf('\\'));
        } else {
            return this.raw.WorkDirectory;
        }
    }

    public addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription): IDeployedApplicationHealthStateFilter {
        let appFilter = clusterHealthChunkQueryDescription.ApplicationFilters.find(appFilter => appFilter.ApplicationNameFilter === this.name);
        if (!appFilter) {
            // Add one filter for current application and node
            appFilter = {
                ApplicationNameFilter: this.name,
                DeployedApplicationFilters: []
            };
            clusterHealthChunkQueryDescription.ApplicationFilters.push(appFilter);
        }
        let deployedApplicationFilter = appFilter.DeployedApplicationFilters.find(filter => filter.NodeNameFilter === this.parent.name);
        if (!deployedApplicationFilter) {
            deployedApplicationFilter = {
                NodeNameFilter: this.parent.name,
                DeployedServicePackageFilters: []
            };
            appFilter.DeployedApplicationFilters.push(deployedApplicationFilter);
        }
        if (deployedApplicationFilter.DeployedServicePackageFilters && deployedApplicationFilter.DeployedServicePackageFilters.length === 0) {
            deployedApplicationFilter.DeployedServicePackageFilters = [{
                HealthStateFilter: HealthStateFilterFlags.All
            }];
        }
        return deployedApplicationFilter;
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawDeployedApplication> {
        return this.data.restClient.getDeployedApplication(this.parent.name, this.id, messageHandler);
    }

    protected refreshFromHealthChunkInternal(healthChunk: IDeployedApplicationHealthStateChunk): Observable<any> {
        return this.health.mergeHealthStateChunk(healthChunk);
    }
}

export class DeployedApplicationHealth extends HealthBase<IRawApplicationHealth> {
    public constructor(data: DataService, public parent: DeployedApplication,
                       protected eventsHealthStateFilter: HealthStateFilterFlags,
                       protected deployedServicePackagesHealthFilter: HealthStateFilterFlags) {
        super(data, parent);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawApplicationHealth> {
        return this.data.restClient.getDeployedApplicationHealth(this.parent.parent.name, this.parent.id, this.eventsHealthStateFilter, this.deployedServicePackagesHealthFilter, messageHandler);
    }
}


