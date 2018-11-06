//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IDataModel<T> {
        // The underlying raw object returned by service fabric REST API
        raw: T;

        // Indicates if the object has been initialized (refreshed at least one time)
        isInitialized: boolean;

        // Indicates if the current object is refreshing (calling REST API to update the raw object)
        isRefreshing: boolean;

        // The parent IDataModel object of this entity (e.g. DeployedApplication has a parent of Node)
        parent: any;

        // A computed uniqueId used to identify this entity
        uniqueId: string;

        // The ID returned from REST API, not necessarily unique
        id: string;

        // The name returned from REST API
        name: string;

        // The healthState of this entity
        healthState: ITextAndBadge;

        // The relative URL of this entity page
        viewPath: string;

        // The actions available to this entity
        actions: ActionCollection;

        // Invokes service fabric REST API to retrieve updated version of this entity
        refresh(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;

        // If current entity is not initialized, call refresh to get the object from server, or return the cached version of the object.
        ensureInitialized(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<any>;

        // Update the wrapped raw object with the specified raw object
        update(raw: T): angular.IPromise<any>;

        // Merges health state information from health state chunk query result
        mergeHealthStateChunk(healthChunk: IHealthStateChunk): angular.IPromise<any>;

        // Update the input IClusterHealthChunkQueryDescription object to include the queries for child entities
        addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription): IHealthStateFilter;
    }

    // Used to decorate the properties in raw object to customize the display names and values.
    export interface IDecorator {
        displayName?: (name: string) => string;
        displayValueInHtml?: (value: any) => string;
    }

    export interface IDecorators {
        // If a showList is defined, only properties in the list will be displayed
        showList?: string[];
        // If a hideList is defined, only properties NOT in the list will be displayed.
        // Do not define both showList and hideList at the same time.
        hideList?: string[];
        // The decorators indexed by the property name in raw object
        decorators?: _.Dictionary<IDecorator>;
    }

    export class DataModelBase<T> implements IDataModel<T> {
        public isInitialized: boolean;
        public actions: ActionCollection;
        public raw: T;
        public parent: any;

        protected valueResolver: ValueResolver;
        private refreshingPromise: angular.IPromise<any>;

        public get isRefreshing(): boolean {
            return !!this.refreshingPromise;
        }

        public get uniqueId(): string {
            return this.id;
        }

        public get id(): string {
            return this.rawAny.Id || this.name;
        }

        public get name(): string {
            return this.rawAny.Name || "";
        }

        public get viewPath(): string {
            return "";
        }

        public get healthState(): ITextAndBadge {
            if (this.rawAny.HealthState) {
                return this.valueResolver.resolveHealthStatus(this.rawAny.HealthState);
            } else if (this.rawAny.AggregatedHealthState) {
                return this.valueResolver.resolveHealthStatus(this.rawAny.AggregatedHealthState);
            }
            return ValueResolver.unknown;
        }

        public constructor(public data: DataService, raw?: T, parent?: any) {
            this.raw = raw;
            this.parent = parent;
            this.valueResolver = new ValueResolver();

            if (this.data) {
                this.actions = new ActionCollection(this.data.telemetry, this.data.$q);
            }

            this.isInitialized = !_.isEmpty(raw);
        }

        // Base refresh logic, do not override, override retrieveNewData/updateInternal to do custom logic
        public refresh(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            if (!this.refreshingPromise) {
                this.refreshingPromise = this.retrieveNewData(messageHandler).then((raw: T) => {
                    return this.update(raw);
                }).then(() => {
                    return this;
                }).finally(() => {
                    this.refreshingPromise = null;
                });
            }
            return this.refreshingPromise;
        }

        public update(raw: T): angular.IPromise<any> {
            if (!_.isEmpty(raw)) {
                this.isInitialized = true;
                this.raw = raw;
                return this.data.$q.when(this.updateInternal());
            }
            return this.data.$q.when(true);
        }

        public ensureInitialized(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            if (!this.isInitialized || forceRefresh) {
                return this.refresh(messageHandler);
            }
            return this.data.$q.when(this);
        }

        public addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription): IHealthStateFilter {
            return null;
        }

        public mergeHealthStateChunk(healthChunk: IHealthStateChunk): angular.IPromise<any> {
            if (this.rawAny.HealthState) {
                this.rawAny.HealthState = healthChunk.HealthState;
            } else if (this.rawAny.AggregatedHealthState) {
                this.rawAny.AggregatedHealthState = healthChunk.HealthState;
            }
            return this.refreshFromHealthChunkInternal(healthChunk);
        }

        protected get rawAny(): any {
            return <any>this.raw;
        }

        // Derived class should override this function to retrieve new version of raw data.
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<T> {
            return this.data.$q.when(this.raw);
        }

        // Derived class should override this function to do custom updating after wrapped object is updated
        protected updateInternal(): angular.IPromise<any> | void {
            return this.data.$q.when(true);
        }

        protected refreshFromHealthChunkInternal(healthChunk: IHealthStateChunk): angular.IPromise<any> {
            return this.data.$q.when(true);
        }
    }

    export class HealthBase<T extends IRawHealth> extends DataModelBase<T> {
        public healthEvents: HealthEvent[] = [];
        public unhealthyEvaluations: HealthEvaluation[] = [];

        public constructor(data: DataService, parent?: any) {
            // Use {} instead of null because health information may be merged into this object
            // before the object gets fully refreshed from server.
            super(data, <T>{}, parent);
        }

        public mergeHealthStateChunk(healthChunk: IHealthStateChunk): angular.IPromise<any> {
            this.raw.AggregatedHealthState = healthChunk.HealthState;
            return this.data.$q.when(true);
        }

        protected updateInternal(): angular.IPromise<any> | void {
            this.parseCommonHealthProperties();
        }

        protected parseCommonHealthProperties() {
            let healthEvents = _.map(this.raw.HealthEvents, rawHealthEvent => new HealthEvent(this.data, <IRawHealthEvent>rawHealthEvent));
            CollectionUtils.updateDataModelCollection(this.healthEvents, healthEvents);

            // There is no unique ID to identify the unhealthy evaluations collection, update the collection directly.
            this.unhealthyEvaluations = Utils.getParsedHealthEvaluations(this.raw.UnhealthyEvaluations);
        }
    }

}

