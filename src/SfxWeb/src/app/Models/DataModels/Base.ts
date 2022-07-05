import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { ITextAndBadge, ValueResolver } from 'src/app/Utils/ValueResolver';
import { DataService } from 'src/app/services/data.service';
import { Observable, of, Subject } from 'rxjs';
import { IHealthStateChunk, IClusterHealthChunkQueryDescription, IHealthStateFilter } from '../HealthChunkRawDataTypes';
import { mergeMap, map } from 'rxjs/operators';
import { ActionCollection } from '../ActionCollection';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

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
    refresh(messageHandler?: IResponseMessageHandler): Observable<any>;

    // If current entity is not initialized, call refresh to get the object from server, or return the cached version of the object.
    ensureInitialized(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<any>;

    // Update the wrapped raw object with the specified raw object
    update(raw: T): Observable<any>;

    // Merges health state information from health state chunk query result
    mergeHealthStateChunk(healthChunk: IHealthStateChunk): Observable<any>;

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
    decorators?: Record<string, IDecorator>;
}

export class DataModelBase<T> implements IDataModel<T> {
    public isInitialized: boolean;
    public actions: ActionCollection;
    public raw: T;
    public parent: any;

    protected valueResolver: ValueResolver;
    private refreshingPromise: Subject<any>;

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
        return this.rawAny.Name || '';
    }

    public get viewPath(): string {
        return '';
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
            this.actions = new ActionCollection(this.data.telemetry);
        }

        this.isInitialized = !!raw;
    }

    // Base refresh logic, do not override, override retrieveNewData/updateInternal to do custom logic
    public refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
        if (!this.refreshingPromise) {
            this.refreshingPromise = new Subject<any>();

            this.retrieveNewData(messageHandler).pipe(mergeMap((raw: T) => {
                return this.update(raw);
            })).subscribe( data => {
                this.refreshingPromise.next(this);
                this.refreshingPromise.complete();
                this.refreshingPromise = null;
            },
            err => {
                this.refreshingPromise.error(this);
                this.refreshingPromise = null;
            });

        }
        return this.refreshingPromise ? this.refreshingPromise.asObservable() : of(null);
    }

    public update(raw: T): Observable<any> {
        if (raw) {
            this.isInitialized = true;
            this.raw = raw;
            return of(this.updateInternal());
        }
        return of(true);
    }

    public ensureInitialized(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<any> {
        if (!this.isInitialized || forceRefresh) {
            return this.refresh(messageHandler).pipe(map(() => this));
        }
        return of(this);
    }

    public addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription): IHealthStateFilter {
        return null;
    }

    public mergeHealthStateChunk(healthChunk: IHealthStateChunk): Observable<any> {
        if (this.rawAny.HealthState) {
            this.rawAny.HealthState = healthChunk.HealthState;
        } else if (this.rawAny.AggregatedHealthState) {
            this.rawAny.AggregatedHealthState = healthChunk.HealthState;
        }
        return this.refreshFromHealthChunkInternal(healthChunk);
    }

    protected get rawAny(): any {
        return this.raw as any;
    }

    // Derived class should override this function to retrieve new version of raw data.
    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<T> {
        return of(this.raw);
    }

    // Derived class should override this function to do custom updating after wrapped object is updated
    protected updateInternal(): Observable<any> | void {
        return of(true);
    }

    protected refreshFromHealthChunkInternal(healthChunk: IHealthStateChunk): Observable<any> {
        return of(true);
    }
}

