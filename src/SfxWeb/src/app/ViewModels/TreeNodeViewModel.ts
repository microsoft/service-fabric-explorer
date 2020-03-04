import { ListSettings } from '../Models/ListSettings';
import { ITextAndBadge } from '../Utils/ValueResolver';
import { IClusterHealthChunk, IClusterHealthChunkQueryDescription } from '../Models/HealthChunkRawDataTypes';
import { BadgeConstants } from '../Common/Constants';
import { IdGenerator } from '../Utils/IdGenerator';
import { TreeViewModel } from './TreeViewModel';
import { ITreeNode } from './TreeTypes';
import { TreeNodeGroupViewModel } from './TreeNodeGroupViewModel';
import { Observable } from 'rxjs';
import { ActionCollection } from '../Models/ActionCollection';

//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

export class TreeNodeViewModel {
    public parent: TreeNodeViewModel;
    public childGroupViewModel: TreeNodeGroupViewModel;
    public displayName: () => string;
    public sortBy: () => any[];
    public listSettings: ListSettings;
    public selected: boolean = false;
    public leafNode: boolean;
    public badge: () => ITextAndBadge;
    public updateHealthChunkQueryDescription: (clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription) => void;
    public mergeClusterHealthStateChunk: (clusterHealthChunk: IClusterHealthChunk) => Observable<any>;
    public actions: ActionCollection;
    public canExpandAll: boolean = false;
    public get depth(): number {
        if (this.parent) {
            return this.parent.depth + 1;
        } else {
            return 0;
        }
    }

    public get paddingLeftPx(): string {
        return this.paddingLeft + "px";
    }

    public get hasChildren(): boolean {
        return this.childGroupViewModel && this.childGroupViewModel.hasChildren;
    }

    public get isExpanded(): boolean {
        return this.childGroupViewModel.isExpanded;
    }

    public get isCollapsed(): boolean {
        return this.childGroupViewModel.isCollapsed;
    }

    public get isVisibleByBadge(): boolean {
        let isVisible = this._node.alwaysVisible ||
            this.badge === undefined ||
            this.badge() === undefined ||
            !this.badge().badgeClass ||
            (this.badge().badgeClass !== BadgeConstants.BadgeUnknown || this._tree.showOkItems) &&
            (this.badge().badgeClass !== BadgeConstants.BadgeOK || this._tree.showOkItems) &&
            (this.badge().badgeClass !== BadgeConstants.BadgeWarning || this._tree.showWarningItems) &&
            (this.badge().badgeClass !== BadgeConstants.BadgeError || this._tree.showErrorItems);
        if (this.selected && !isVisible) {
            this._tree.selectTreeNode([IdGenerator.cluster()]);
        }
        
        return isVisible;
    }

    public get allChildrenInvisibleByBadge(): boolean {
        let children = this.childGroupViewModel.children;
        if (children.length === 0) {
            return false;
        }

        for (let i = 0; i < children.length; i++) {
            if (children[i].isVisibleByBadge) {
                return false;
            }
        }

        return true;
    }

    public get hasExpander(): boolean {
        return !this.leafNode && this.hasChildren && !this.allChildrenInvisibleByBadge;
    }

    public get displayHtml(): string {
        let name = this.displayName();
        if (this._tree && this._tree.searchTerm && this._tree.searchTerm.trim()) {
            let searchTerm = this._tree.searchTerm;
            let matchIndex = name.toLowerCase().indexOf(searchTerm.toLowerCase());

            if (matchIndex !== -1) {
                return name.substring(0, matchIndex) + "<span class='search-match'>" + name.substr(matchIndex, searchTerm.length) + "</span>" + name.substring(matchIndex + searchTerm.length);
            }
        }

        return name;
    }

    private _tree: TreeViewModel;
    private _node: ITreeNode;
    private _keyboardSelectActionDelayInMilliseconds: number = 200;

    private get hasExpandedAndLoadedChildren(): boolean {
        return this.hasChildren && this.isExpanded && this.childGroupViewModel.children.length !== 0;
    }

    private get paddingLeft(): number {
        // 18px is the total width of the expander icon
        return (18 * (this.depth + 1));
    }

    constructor(tree: TreeViewModel, node: ITreeNode, parent: TreeNodeViewModel) {
        this.parent = parent;
        this._tree = tree;
        this.update(node);

        if (node.startExpanded && !this.childGroupViewModel.isExpanded) {
            this.toggle();
        }
    }

    public update(node: ITreeNode) {
        this._node = node;
        this.displayName = this._node.displayName;
        this.leafNode = !this._node.childrenQuery;
        this.sortBy = node.sortBy ? node.sortBy : () => [];
        this.listSettings = this._node.listSettings;
        this.actions = this._node.actions;
        this.badge = this._node.badge;
        this.updateHealthChunkQueryDescription = this._node.addHealthStateFiltersForChildren;
        this.mergeClusterHealthStateChunk = this._node.mergeClusterHealthStateChunk;
        if (this.childGroupViewModel) {
            this.childGroupViewModel.childrenQuery = this._node.childrenQuery;
        } else {
            this.childGroupViewModel = new TreeNodeGroupViewModel(this._tree, this, this._node.childrenQuery);
        }

        this.canExpandAll = node.canExpandAll;
    }

    public toggle() {
        this.childGroupViewModel.toggle();
    }

    public toggleAll() {
        if (!this.childGroupViewModel.isExpanded) {
            this.childGroupViewModel.expand().subscribe( () => {
                this.childGroupViewModel.children.forEach(child => {
                    child.toggleAll();
                });
            });
        }
    }

    public closeAll() {
        if (this.childGroupViewModel.isExpanded) {
            this.childGroupViewModel.children.forEach(child => {
                child.closeAll();
            });
            this.childGroupViewModel.collapse();
        }
    }

    public handleClick() {
        this.select();
    }

    public select(actionDelay?: number, skipSelectAction?: boolean) {
        if (this._tree.selectNode(this)) {
            if (this._node.selectAction && !skipSelectAction) {
                setTimeout(() => {
                    if (this.selected) {
                        this._node.selectAction();
                    }
                }, actionDelay | 0);
            }
        }
    }

    public get nodeId() {
        return this._node.nodeId;
    }

    public selectNext(actionDelay?: number) {
        if (this.hasExpandedAndLoadedChildren) {
            this.childGroupViewModel.displayedChildren[0].select(this._keyboardSelectActionDelayInMilliseconds);
        } else {
            this.selectNextSibling();
        }
    }

    public selectPrevious(actionDelay?: number) {
        let parentsChildren = this.getParentsChildren();
        let myIndex = parentsChildren.indexOf(this);

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

    public isParentOf(node: TreeNodeViewModel): boolean {
        let parent = node.parent;
        while (parent && parent !== this) {
            parent = parent.parent;
        }
        return (parent === this);
    }

    private selectNextSibling(): number {
        let parentsChildren = this.getParentsChildren();
        let myIndex = parentsChildren.indexOf(this);

        if (myIndex === parentsChildren.length - 1 && this.parent) {
            this.parent.selectNextSibling();
        } else if (myIndex !== parentsChildren.length - 1) {
            parentsChildren[myIndex + 1].select(this._keyboardSelectActionDelayInMilliseconds);
        }
        return myIndex;
    }

    private getParentsChildren(): TreeNodeViewModel[] {
        return this.parent ? this.parent.childGroupViewModel.displayedChildren : this._tree.childGroupViewModel.displayedChildren;
    }

    private selectLast() {
        if (this.hasExpandedAndLoadedChildren) {
            let lastChild: TreeNodeViewModel = this.childGroupViewModel.displayedChildren[this.childGroupViewModel.displayedChildren.length - 1];
            lastChild.selectLast();
        } else {
            this.select(this._keyboardSelectActionDelayInMilliseconds);
        }
    }
}

