import { IDataModel } from '../Base';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, Subject, throwError, of, forkJoin, AsyncSubject } from 'rxjs';
import { IClusterHealthChunk, IHealthStateChunk, IHealthStateChunkList } from '../../HealthChunkRawDataTypes';
import { ValueResolver } from 'src/app/Utils/ValueResolver';
import { mergeMap, map, finalize, catchError } from 'rxjs/operators';
import { CollectionUtils } from 'src/app/Utils/CollectionUtils';
import { Utils } from 'src/app/Utils/Utils';
import { DataService } from 'src/app/services/data.service';

export interface IDataModelCollection<T extends IDataModel<any>> {
    // The real collection wrapped
    collection: T[];

    // The length of current collection
    length: number;

    // Indicates if the collection has been initialized (refreshed at least one time)
    isInitialized: boolean;

    // Indicates if the current collection is refreshing (calling REST API to update the raw object)
    isRefreshing: boolean;

    // The relative URL of this collection page
    viewPath: string;

    // Find the entity from current collection by unique ID
    find(uniqueId: string): T;

    // Invokes service fabric REST API to retrieve updated version of this collection
    refresh(messageHandler?: IResponseMessageHandler): Observable<any>;

    // If current entity is not initialized, call refresh to get the object from server, or return the cached version of the object.
    ensureInitialized(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<any>;

    // Find and merge the health chunk data into current collection
    mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): Observable<any>;
}

export class DataModelCollectionBase<T extends IDataModel<any>> implements IDataModelCollection<T> {
    public isInitialized = false;
    public parent: any;
    public collection: T[] = [];

    protected valueResolver: ValueResolver = new ValueResolver();

    private appendOnly: boolean;
    private hash: Record<string, T>;
    private refreshingPromise: Subject<any>;

    public get viewPath(): string {
        return '';
    }

    public get length(): number {
        return this.collection.length;
    }

    public get isRefreshing(): boolean {
        return !!this.refreshingPromise;
    }

    protected get indexPropery(): string {
        // index the collection by "uniqueId" by default
        return 'uniqueId';
    }

    public constructor(public data: DataService, parent?: any, appendOnly: boolean = false) {
        this.parent = parent;
        this.appendOnly = appendOnly;
    }

    // Base refresh logic, do not override
    public refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
        if (!this.refreshingPromise) {
            this.refreshingPromise = new AsyncSubject<any>();

            this.retrieveNewCollection(messageHandler).pipe(mergeMap(collection => {
                return this.update(collection);
            }),
            catchError( err => of(err))
            ).subscribe( () => {
                this.refreshingPromise.next(this);
                this.refreshingPromise.complete();
                this.refreshingPromise = null;
            });
            // , error => {
            //     console.log(error)
            //     if (error) {
            //         throw error;
            //     }
            //     // Else skipping as load got canceled.
            //     return of(null);
            // }
                // this.refreshingLoadPromise.load(() => {
                //     return this.retrieveNewCollection(messageHandler);
                // }).catch((error) => {
                //     if (error && error.isCanceled !== true) {
                //         throw error;
                //     }
                //     // Else skipping as load got canceled.
                //     return this.data.$q.when(null);
                // }).then(collection => {
                //     if (collection) {
                //         return this.update(collection);
                //     }
                // }).then(() => {
                //     return this;
                // }).finally(() => {
                //     this.refreshingPromise = null;
                // });
        }
        return this.refreshingPromise ? this.refreshingPromise.asObservable() : of(null);
    }

    public clear(): Observable<any> {
        this.cancelLoad();
        return of(this.refreshingPromise ? this.refreshingPromise : true).pipe(map(() => {
            this.collection = [];
            this.isInitialized = false;
        }));
    }

    protected cancelLoad(): void {
        if (this.refreshingPromise) {
            this.refreshingPromise.next();
            this.refreshingPromise.complete();
        }
    }

    protected update(collection: T[]): Observable<any> {
        this.isInitialized = true;

        this.collection = CollectionUtils.updateDataModelCollection(this.collection, collection, this.appendOnly);

        this.hash = Utils.keyBy(this.collection, this.indexPropery);
        return this.updateInternal();
    }

    public ensureInitialized(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<any> {
        if (!this.isInitialized || forceRefresh) {
            return this.refresh(messageHandler);
        }
        return of(this);
    }

    public find(uniqueId: string): T {
        if (this.hash) {
            return this.hash[uniqueId];
        }
        return null;
    }

    public mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): Observable<any> {
        return of(true);
    }

    // All derived class should override this function to do custom refreshing
    protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): Observable<T[]> {
        return throwError(null);
    }

    // Derived class should override this function to do custom updating
    protected updateInternal(): Observable<any>{
        return of(true);
    }

    protected updateCollectionFromHealthChunkList<P extends IHealthStateChunk>(
        healthChunkList: IHealthStateChunkList<P>,
        newIdSelector: (item: P) => string): Observable<any> {

        if (!CollectionUtils.compareCollectionsByKeys(this.collection, healthChunkList.Items, item => item[this.indexPropery], newIdSelector)) {
            if (!this.isRefreshing) {
                // If the health chunk data has different set of keys, refresh the entire collection
                // to get full information of the new items.
                return this.refresh();
            } else {
                return of(true);
            }
        }

        // Merge health chunk data
        const updatePromises = [];
        CollectionUtils.updateCollection<T, P>(
            this.collection,
            healthChunkList.Items,
            item => item[this.indexPropery],
            newIdSelector,
            null, // no need to create object because a full refresh will be scheduled when new object is returned by health chunk API,
            // which is needed because the information returned by the health chunk api is not enough for us to create a full data object.
            (item: T, newItem: P) => {
                updatePromises.push(item.mergeHealthStateChunk(newItem));
            });

        return forkJoin(updatePromises);
    }

    // Derived class should implement this if it is going to use details-view directive as child and call showDetails(itemId).
    protected getDetailsList(item: any): IDataModelCollection<any> {
        return null;
    }
}
