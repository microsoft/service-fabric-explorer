import { TreeNodeViewModel } from './TreeNodeViewModel';
import { ITreeNode } from './TreeTypes';
import { TreeViewModel } from './TreeViewModel';
import { IClusterHealthChunkQueryDescription, IClusterHealthChunk } from '../Models/HealthChunkRawDataTypes';
import { Observable, of, forkJoin, Subject } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
export class TreeNodeGroupViewModel {

    public children: TreeNodeViewModel[] = [];
    public loadingChildren: boolean = false;
    public childrenLoaded: boolean = false;
    public owningNode: TreeNodeViewModel;
    public childrenQuery: () => Observable<ITreeNode[]>;

    public get displayedChildren(): TreeNodeViewModel[] {
        let result = this.children;
        if (this.owningNode && this.owningNode.listSettings) {
            result = result.slice(this.owningNode.listSettings.begin, this.owningNode.listSettings.begin + this.owningNode.listSettings.limit);
        }
        return result;
    }

    public get hasChildren(): boolean {
        return !this.childrenLoaded || this.children.length !== 0;
    }

    public get isExpanded(): boolean {
        return this._isExpanded && this.hasChildren;
    }

    public get isCollapsed(): boolean {
        return !this._isExpanded && this.hasChildren;
    }

    public get paddingLeftPx(): string {
        if (this.owningNode) {
            return this.owningNode.paddingLeftPx;
        } else {
            return "45px";
        }
    }

    private _tree: TreeViewModel;
    private _isExpanded: boolean = false;
    private _currentGetChildrenPromise: Subject<any>;

    constructor(tree: TreeViewModel, owningNode: TreeNodeViewModel, childrenQuery: () => Observable<ITreeNode[]>) {
        this._tree = tree;
        this.owningNode = owningNode;
        this.childrenQuery = childrenQuery;
    }

    public toggle(): Observable<any> {
        this._isExpanded = !this._isExpanded;
        return this._isExpanded ? this.getChildren() : of(true);
    }

    public expand(): Observable<any> {
        this._isExpanded = true;
        return this.getChildren();
    }

    public collapse() {
        this._isExpanded = false;
    }

    public pageDown() {
        if (!this.owningNode || !this.owningNode.listSettings) {
            return;
        }

        let listSettings = this.owningNode.listSettings;
        if (listSettings.currentPage < listSettings.pageCount) {
            listSettings.currentPage++;
        }
    }

    public pageUp() {
        if (!this.owningNode || !this.owningNode.listSettings) {
            return;
        }

        let listSettings = this.owningNode.listSettings;
        if (listSettings.currentPage > 1) {
            listSettings.currentPage--;
        }
    }

    public pageFirst() {
        if (!this.owningNode || !this.owningNode.listSettings) {
            return;
        }

        let listSettings = this.owningNode.listSettings;
        listSettings.currentPage = 1;
    }

    public pageLast() {
        if (!this.owningNode || !this.owningNode.listSettings) {
            return;
        }

        let listSettings = this.owningNode.listSettings;
        listSettings.currentPage = listSettings.pageCount;
    }

    public updateHealthChunkQueryRecursively(healthChunkQueryDescription: IClusterHealthChunkQueryDescription): void {
        if (!this._isExpanded) {
            return;
        }

        if (this.owningNode && this.owningNode.updateHealthChunkQueryDescription) {
            this.owningNode.updateHealthChunkQueryDescription(healthChunkQueryDescription);
        }

        this.children.forEach(child => {
            child.childGroupViewModel.updateHealthChunkQueryRecursively(healthChunkQueryDescription);
        });
    }

    public updateDataModelFromHealthChunkRecursively(clusterHealthChunk: IClusterHealthChunk): Observable<any> {
        if (!this._isExpanded) {
            return of(true);
        }

        return of(this.owningNode && this.owningNode.mergeClusterHealthStateChunk
            ? this.owningNode.mergeClusterHealthStateChunk(clusterHealthChunk)
            : true).pipe(map( () => {
                let updateChildrenPromises = this.children.map(child => {
                    return child.childGroupViewModel.updateDataModelFromHealthChunkRecursively(clusterHealthChunk);
                });
                return forkJoin(updateChildrenPromises);
            } ))
    }

    public refreshExpandedChildrenRecursively(): Observable<any> {
        if (!this.childrenQuery || !this._isExpanded) {
            return of(true);
        }

        return this.childrenQuery().pipe(mergeMap(response => {
            let children = this.children;

            // Remove nodes that no longer exist
            for (let i = 0; i < children.length; i++) {
                let node = children[i];
                if (!node.nodeId) {
                    continue;
                }

                let exists = this.exists(response, node, (a, b) => a.nodeId === b.nodeId);
                if (!exists) {
                    // Unselect removed node
                    if (this._tree.selectedNode && (node === this._tree.selectedNode || node.isParentOf(this._tree.selectedNode))) {
                        // Select the parent node instead
                        node.parent.select();
                    }
                    children.splice(i, 1);
                    i--;
                }
            }

            // Clone children before adding new, to refresh recursively
            let childrenToRefresh = children.slice(0);

            // Add new nodes / update existing
            for (let i = 0; i < response.length; i++) {
                let respNode = response[i];
                if (!respNode.nodeId) {
                    continue;
                }

                let existing = this.exists(children, respNode, (a, b) => a.nodeId === b.nodeId ? a : null);
                if (existing) {
                    // Update existing
                    existing.update(respNode);
                } else {
                    // Add new
                    let newNode = new TreeNodeViewModel(this._tree, respNode, this.owningNode);

                    // Find the correct index in the sorted array
                    let index = _.sortedIndexBy(children, newNode, (item) => item.sortBy());
                    children.splice(index, 0, newNode);
                }
            }

            // Recursively refresh children
            let promises: Observable<void>[] = [];
            childrenToRefresh.forEach(child => {
                promises.push(child.childGroupViewModel.refreshExpandedChildrenRecursively());
            });

            // Update paging settings
            if (this.owningNode && this.owningNode.listSettings) {
                this.owningNode.listSettings.count = this.children.length;
            }

            return forkJoin(promises);
        }));
    }

    private getChildren(): Observable<any> {
        if (!this.childrenQuery || this.childrenLoaded) {
            return of(true);
        }

        if (!this._currentGetChildrenPromise) {
            this.loadingChildren = true;
            this._currentGetChildrenPromise = new Subject();
            this.childrenQuery().subscribe(response => {

                let childrenViewModels: TreeNodeViewModel[] = [];
                for (let i = 0; i < response.length; i++) {
                    let node = response[i];
                    childrenViewModels.push(new TreeNodeViewModel(this._tree, node, this.owningNode));
                }
                // Sort the children
                this.children = childrenViewModels //.sort( (item1, item2) => <number>item1.sortBy() - <number>item2.sortBy()); TODO fix the sorting here

                this.childrenLoaded = true;

                if (this.owningNode && this.owningNode.listSettings) {
                    this.owningNode.listSettings.count = this.children.length;
                }

                this._currentGetChildrenPromise.next();
                this._currentGetChildrenPromise.complete();
                this._currentGetChildrenPromise = null;
                this.loadingChildren = false;

            });
        }

        return this._currentGetChildrenPromise || of(null);
    }

    private exists(array: any[], item: any, comparer: (a: any, b: any) => any): any {
        for (let i = 0; i < array.length; i++) {
            let existing = comparer(array[i], item);
            if (existing) {
                return existing;
            }
        }

        return false;
    }
}

