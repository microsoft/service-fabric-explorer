import { ITreeNode } from './TreeTypes';
import { TreeViewModel } from './TreeViewModel';
import { IClusterHealthChunkQueryDescription, IClusterHealthChunk } from '../Models/HealthChunkRawDataTypes';
import { Observable, of, forkJoin, Subject } from 'rxjs';
import { map, mergeMap, filter } from 'rxjs/operators';
import { BadgeConstants } from '../Common/Constants';
import { IdGenerator } from '../Utils/IdGenerator';
import { ListSettings } from '../Models/ListSettings';
import { ActionCollection } from '../Models/ActionCollection';
import { ITextAndBadge } from '../Utils/ValueResolver';
import orderBy from 'lodash/orderBy';
// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------
export class TreeNodeGroupViewModel {
    public parent: TreeNodeGroupViewModel;
    public sortBy: () => any[];
    public selected = false;
    public leafNode: boolean;
    public displayName: () => string;
    public listSettings: ListSettings;
    public badge: () => ITextAndBadge;
    public actions: ActionCollection;
    public canExpandAll = false;

    public get depth(): number {
        if (this.parent) {
            return this.parent.depth + 1;
        } else {
            return 0;
        }
    }

    public _tree: TreeViewModel;
    public node: ITreeNode;
    private _keyboardSelectActionDelayInMilliseconds = 200;

    public children: TreeNodeGroupViewModel[] = [];
    public loadingChildren = false;
    public childrenLoaded = false;

    private _isExpanded = false;
    private _currentGetChildrenPromise: Subject<any>;

    public get displayedChildren(): TreeNodeGroupViewModel[] {
        let result = this.children.filter(node => node.isVisibleByBadge);

        if (this.node && this.node.listSettings) {
            this.node.listSettings.count = result.length;
            result = result.slice(this.node.listSettings.begin, this.node.listSettings.begin + this.node.listSettings.limit);
        }
        return result;
    }

    public get hasChildren(): boolean {
        return !this.childrenLoaded || this.children.length !== 0;
    }

    public get isExpanded(): boolean {
        return  this._isExpanded && !!this.node.childrenQuery;
    }

    public get isCollapsed(): boolean {
        return !this._isExpanded && this.hasChildren;
    }

    public get paddingLeftPx(): string {
        if (this.parent) {
            return this.nonRootpaddingLeftPx;
        } else {
            return '10px';
        }
    }

    constructor(tree: TreeViewModel, node: ITreeNode, parent: TreeNodeGroupViewModel) {
        this._tree = tree;
        this.node = node;
        this.parent = parent;
        this.listSettings = node.listSettings;
        this.displayName = node.displayName || function(){ return ''; };
        this.update(node);
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

    public updateHealthChunkQueryRecursively(healthChunkQueryDescription: IClusterHealthChunkQueryDescription): void {
        if (!this._isExpanded) {
            return;
        }

        if (this.node && this.node.addHealthStateFiltersForChildren) {
            this.node.addHealthStateFiltersForChildren(healthChunkQueryDescription);
        }

        this.children.forEach(child => {
            child.updateHealthChunkQueryRecursively(healthChunkQueryDescription);
        });
    }

    public updateDataModelFromHealthChunkRecursively(clusterHealthChunk: IClusterHealthChunk): Observable<any> {
        if (!this._isExpanded) {
            return of(true);
        }

        return of(this.node && this.node.mergeClusterHealthStateChunk
            ? this.node.mergeClusterHealthStateChunk(clusterHealthChunk)
            : true).pipe(map( () => {
                const updateChildrenPromises = this.children.map(child => {
                    return child.updateDataModelFromHealthChunkRecursively(clusterHealthChunk);
                });
                return forkJoin(updateChildrenPromises);
            } ));
    }

    public refreshExpandedChildrenRecursively(): Observable<any> {
        if (!this.node.childrenQuery || !this._isExpanded) {
            return of(true);
        }

        return this.node.childrenQuery().pipe(mergeMap(response => {
            const filteredChildren = [];
            this.children.forEach(child => {
                if (response.some(newChild => newChild.nodeId === child.nodeId) ) {
                    filteredChildren.push(child);
                }else {
                    if (this._tree.selectedNode && (child === this._tree.selectedNode || child.isParentOf(this._tree.selectedNode))) {
                        // Select the parent node instead
                        child.parent.select();
                    }
                }
            });

            response.forEach(child => {
                const existingNode = filteredChildren.find(node => node.nodeId === child.nodeId);
                if (existingNode) {
                    existingNode.update(child);
                }else{
                    filteredChildren.push(new TreeNodeGroupViewModel(this._tree, child, this));
                }
            });

            this.children = filteredChildren;

            return forkJoin(this.children.map(child => child.refreshExpandedChildrenRecursively()));
        }));
    }

    private getChildren(): Observable<any> {
        if (!this.node.childrenQuery || this.childrenLoaded) {
            return of(true);
        }

        if (!this._currentGetChildrenPromise) {
            this.loadingChildren = true;
            this._currentGetChildrenPromise = new Subject();
            this.node.childrenQuery().subscribe(response => {

                this.children = response.map(node => new TreeNodeGroupViewModel(this._tree, node, this));
                // Sort the children
                this.children = orderBy(this.children, item => item.sortBy ? item.sortBy() : []);

                this.childrenLoaded = true;

                if (this.node && this.node.listSettings) {
                    this.node.listSettings.count = this.children.length;
                }

                this._currentGetChildrenPromise.next();
                this._currentGetChildrenPromise.complete();
                this._currentGetChildrenPromise = null;
                this.loadingChildren = false;

            },
            () => {
                this._currentGetChildrenPromise.next();
                this._currentGetChildrenPromise.complete();
                this._currentGetChildrenPromise = null;
                this.loadingChildren = false;
            });
        }

        return this._currentGetChildrenPromise ? this._currentGetChildrenPromise.asObservable() : of(null);
    }

    public get nonRootpaddingLeftPx(): string {
        // 18px is the total width of the expander icon
       return (18 * (this.depth - .5)) + 'px';
   }

   public get isVisibleByBadge(): boolean {
       const badgeState = this.node.badge ? this.node.badge() : null;
       let isVisible = this.node.alwaysVisible ||
                       badgeState === null ||
                       !badgeState?.badgeClass;

       if (!isVisible) {
           switch (badgeState.badgeClass) {
               case BadgeConstants.BadgeUnknown:
               case BadgeConstants.BadgeOK:
                   isVisible = this._tree.showOkItems;
                   break;
               case BadgeConstants.BadgeWarning:
                   isVisible = this._tree.showWarningItems;
                   break;
               case BadgeConstants.BadgeError:
                   isVisible = this._tree.showErrorItems;
                   break;
               default:
                   break;
           }
       }

       if (this.selected && !isVisible) {
            this._tree.selectTreeNode([IdGenerator.cluster()]);
        }

       return isVisible;
    }

    public get allChildrenInvisibleByBadge(): boolean {
        return !this.children.every(child => child.isVisibleByBadge);
    }

    public get hasExpander(): boolean {
        return !this.leafNode && this.hasChildren && !this.allChildrenInvisibleByBadge;
    }

    public get displayHtml(): string {
        const name = this.node.displayName();
        if (this._tree && this._tree.searchTerm && this._tree.searchTerm.trim()) {
            const searchTerm = this._tree.searchTerm;
            const matchIndex = name.toLowerCase().indexOf(searchTerm.toLowerCase());

            if (matchIndex !== -1) {
                return name.substring(0, matchIndex) + '<span class=\'search-match\'>' + name.substr(matchIndex, searchTerm.length) + '</span>' + name.substring(matchIndex + searchTerm.length);
            }
        }

        return name;
    }

    private get hasExpandedAndLoadedChildren(): boolean {
        return this.hasChildren && this.isExpanded && this.children.length !== 0;
    }

    public toggleAll() {
        if (!this.isExpanded) {
            this.expand().subscribe( () => {
                this.children.forEach(child => {
                    child.toggleAll();
                });
            });
        }
    }

    public closeAll() {
        if (this.isExpanded) {
            this.children.forEach(child => {
                child.closeAll();
            });
            this.collapse();
        }
    }

    public select(actionDelay?: number, skipSelectAction?: boolean) {
        if (this._tree.selectNode(this)) {
            if (this.node.selectAction && !skipSelectAction) {
                setTimeout(() => {
                    if (this.selected) {
                        this.node.selectAction();
                    }
                }, actionDelay | 0);
            }
        }
    }

    public get nodeId() {
        return this.node.nodeId;
    }

    public selectNext(actionDelay?: number) {
        if (this.hasExpandedAndLoadedChildren) {
            this.displayedChildren[0].select(this._keyboardSelectActionDelayInMilliseconds);
        } else {
            this.selectNextSibling();
        }
    }

    public selectPrevious(actionDelay?: number) {
        const parentsChildren = this.getParentsChildren();
        const myIndex = parentsChildren.indexOf(this);

        if (myIndex === 0 && this.parent) {
            this.parent.select(this._keyboardSelectActionDelayInMilliseconds);
        } else if (myIndex !== 0) {
            parentsChildren[myIndex - 1].selectLast();
        }
    }

    public expandOrMoveToChild() {
        if (this.hasChildren) {
            if (this.isCollapsed) {
                this.toggle();
            } else {
                this.selectNext();
            }
        }
    }

    public collapseOrMoveToParent() {
        if (this.hasChildren && this.isExpanded) {
            this.toggle();
        } else if (this.parent) {
            this.parent.select(this._keyboardSelectActionDelayInMilliseconds);
        }
    }

    public isParentOf(node: TreeNodeGroupViewModel): boolean {
        let parent = node.parent;
        while (parent && parent !== this) {
            parent = parent.parent;
        }
        return (parent === this);
    }

    private getParentsChildren(): TreeNodeGroupViewModel[] {
        return this.parent ? this.parent.displayedChildren : this._tree.childGroupViewModel.displayedChildren;
    }

    private selectLast() {
        if (this.hasExpandedAndLoadedChildren) {
            const lastChild: TreeNodeGroupViewModel = this.displayedChildren[this.displayedChildren.length - 1];
            lastChild.selectLast();
        } else {
            this.select(this._keyboardSelectActionDelayInMilliseconds);
        }
    }


    public update(node: ITreeNode) {
        this.node = node;
        this.displayName = this.node.displayName;
        this.leafNode = !this.node.childrenQuery;
        this.sortBy = node.sortBy ? node.sortBy : () => [];
        this.listSettings = this.node.listSettings;
        this.actions = this.node.actions;
        this.badge = this.node.badge || null;
        this.canExpandAll = node.canExpandAll;
    }


    public pageDown() {
        if (!this.node || !this.node.listSettings) {
            return;
        }

        const listSettings = this.node.listSettings;
        if (listSettings.currentPage < listSettings.pageCount) {
            listSettings.currentPage++;
        }
    }

    public pageUp() {
        if (!this.node || !this.node.listSettings) {
            return;
        }

        const listSettings = this.node.listSettings;
        if (listSettings.currentPage > 1) {
            listSettings.currentPage--;
        }
    }

    public pageFirst() {
        if (!this.node || !this.node.listSettings) {
            return;
        }

        const listSettings = this.node.listSettings;
        listSettings.currentPage = 1;
    }

    public pageLast() {
        if (!this.node || !this.node.listSettings) {
            return;
        }

        const listSettings = this.node.listSettings;
        listSettings.currentPage = listSettings.pageCount;
    }

    private selectNextSibling(): number {
        const parentsChildren = this.getParentsChildren();
        const myIndex = parentsChildren.indexOf(this);

        if (myIndex === parentsChildren.length - 1 && this.parent) {
            this.parent.selectNextSibling();
        } else if (myIndex !== parentsChildren.length - 1) {
            parentsChildren[myIndex + 1].select(this._keyboardSelectActionDelayInMilliseconds);
        }
        return myIndex;
    }

    public get filtered(): number {
        if (this._tree.searchTerm.length === 0) {
            return 0;
        }else {
            let count = 0;
            if (this.displayName().toLowerCase().indexOf(this._tree.searchTerm.toLowerCase()) > -1) {
                count ++;
            }
            this.children.forEach(child => count += child.filtered );
            return count;
        }
    }
}

