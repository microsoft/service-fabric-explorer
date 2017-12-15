//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export class DeployedApplication extends DataModelBase<IRawDeployedApplication> {
        public decorators: IDecorators = {
            decorators: {
                "TypeName": {
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
            return this.data.routes.getDeployedAppViewPath(this.parent.name, this.id);
        }

        public get appTypeViewPath(): string {
            return this.data.routes.getAppTypeViewPath(this.raw.TypeName);
        }

        public get diskLocation(): string {
            if (this.raw.WorkDirectory) {
                return this.raw.WorkDirectory.substring(0, this.raw.WorkDirectory.lastIndexOf("\\"));
            } else {
                return this.raw.WorkDirectory;
            }
        }

        public addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription): IDeployedApplicationHealthStateFilter {
            let appFilter = _.find(clusterHealthChunkQueryDescription.ApplicationFilters, appFilter => appFilter.ApplicationNameFilter === this.name);
            if (!appFilter) {
                // Add one filter for current application and node
                appFilter = {
                    ApplicationNameFilter: this.name,
                    DeployedApplicationFilters: []
                };
                clusterHealthChunkQueryDescription.ApplicationFilters.push(appFilter);
            }
            let deployedApplicationFilter = _.find(appFilter.DeployedApplicationFilters, filter => filter.NodeNameFilter === this.parent.name);
            if (!deployedApplicationFilter) {
                deployedApplicationFilter = {
                    NodeNameFilter: this.parent.name,
                    DeployedServicePackageFilters: []
                };
                appFilter.DeployedApplicationFilters.push(deployedApplicationFilter);
            }
            if (_.isEmpty(deployedApplicationFilter.DeployedServicePackageFilters)) {
                deployedApplicationFilter.DeployedServicePackageFilters = [{
                    HealthStateFilter: HealthStateFilterFlags.All
                }];
            }
            return deployedApplicationFilter;
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawDeployedApplication> {
            return Utils.getHttpResponseData(this.data.restClient.getDeployedApplication(this.parent.name, this.id, messageHandler));
        }

        protected refreshFromHealthChunkInternal(healthChunk: IDeployedApplicationHealthStateChunk): angular.IPromise<any> {
            return this.health.mergeHealthStateChunk(healthChunk);
        }
    }

    export class DeployedApplicationHealth extends HealthBase<IRawApplicationHealth> {
        public constructor(data: DataService, public parent: DeployedApplication,
            protected eventsHealthStateFilter: HealthStateFilterFlags,
            protected deployedServicePackagesHealthFilter: HealthStateFilterFlags) {
            super(data, parent);
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawApplicationHealth> {
            return Utils.getHttpResponseData(this.data.restClient.getDeployedApplicationHealth(this.parent.parent.name, this.parent.id,
                this.eventsHealthStateFilter, this.deployedServicePackagesHealthFilter, messageHandler));
        }
    }
}

