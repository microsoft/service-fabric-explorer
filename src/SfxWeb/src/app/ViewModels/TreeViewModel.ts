import { IClusterHealthChunkQueryDescription, IClusterHealthChunk } from '../Models/HealthChunkRawDataTypes';
import { TreeNodeGroupViewModel } from './TreeNodeGroupViewModel';
import { ITreeNode } from './TreeTypes';
import { Observable } from 'rxjs';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export class TreeViewModel {
    public childGroupViewModel: TreeNodeGroupViewModel;
    public selectedNode: TreeNodeGroupViewModel;

    public showOkItems = true;
    public showWarningItems = true;
    public showErrorItems = true;

    public searchTerm = '';

    public firstTreeSelect = true;

    public get isLoading(): boolean {
        return !this.childGroupViewModel ||
            (this.childGroupViewModel.children.length === 0 && this.childGroupViewModel.loadingChildren);
    }

    public get isEmpty(): boolean {
        return this.childGroupViewModel &&
            !this.childGroupViewModel.children.length;
    }

    private _childrenQuery: () => Observable<ITreeNode[]>;
    private _selectTreeNodeOpId = 1;

    constructor(childrenQuery: () => Observable<ITreeNode[]>) {
        this._childrenQuery = childrenQuery;
        this.refreshChildren();
    }

    public refreshChildren() {
        const baseNode: ITreeNode = {childrenQuery: this._childrenQuery,
                                     displayName: () => '',
                                    nodeId: 'base'};
        this.childGroupViewModel = new TreeNodeGroupViewModel(this, baseNode, null);
        if (this.childGroupViewModel.isCollapsed) {
            this.childGroupViewModel.toggle().subscribe(() => {
                if (this.childGroupViewModel.children.length > 0) {
                    this.childGroupViewModel.children[0].toggle();
                }
            });
        }
    }

    public selectNode(node: TreeNodeGroupViewModel): boolean {
        if (this.selectedNode === node) {
            return false;
        }

        if (this.selectedNode) {
            this.selectedNode.selected = false;
        }

        if (node) {
            node.selected = true;
        }

        this.selectedNode = node;
        return true;
    }

    public onKeyDown(event: KeyboardEvent) {
        const selectedNode = this.selectedNode;
        switch (event.which) {
            case 40: // Down
                this.selectedNode.selectNext();
                break;
            case 38: // Up
                this.selectedNode.selectPrevious();
                break;
            case 39: // Right
                this.selectedNode.expandOrMoveToChild();
                break;
            case 37: // Left
                this.selectedNode.collapseOrMoveToParent();
                break;
        }
        if (selectedNode !== this.selectedNode) {
            // Prevents the key press from moving the scroll bar
            event.preventDefault();
        }
    }

    // Recursively refreshes all expanded nodes starting from the root
    public refresh(): Observable<any> {
        return this.childGroupViewModel.refreshExpandedChildrenRecursively();
    }

    public selectTreeNode(path: string[], skipSelectAction?: boolean): Observable<void> {
        this._selectTreeNodeOpId++;
        const opId = this._selectTreeNodeOpId;
        return this.selectTreeNodeInternal(path, 0, this.childGroupViewModel, opId, skipSelectAction);
    }

    public addHealthChunkFiltersRecursively(clusterHealthQueryDescription: IClusterHealthChunkQueryDescription): IClusterHealthChunkQueryDescription {
        this.childGroupViewModel.updateHealthChunkQueryRecursively(clusterHealthQueryDescription);
        return clusterHealthQueryDescription;
    }

    public mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): Observable<any> {
        return this.childGroupViewModel.updateDataModelFromHealthChunkRecursively(clusterHealthChunk);
    }

    private selectTreeNodeInternal(path: string[], currIndex: number, group: TreeNodeGroupViewModel, opId: number, skipSelectAction?: boolean): Observable<void> {
        const observ = group.expand();
        observ.subscribe(() => {
            if (opId !== this._selectTreeNodeOpId) {
                return;
            }

            let node: TreeNodeGroupViewModel = null;
            const nodes = group.children;
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeId === path[currIndex]) {
                    node = nodes[i];
                    break;
                }
            }

            if (node) {

                // Scroll to the page which contains the current node
                if (node.parent && node.parent.listSettings) {
                    const index = nodes.indexOf(node);
                    if (index >= 0) {
                        node.parent.listSettings.setPageWithIndex(index);
                    }
                }

                if (currIndex === path.length - 1) {
                    if (!node.selected) {
                        // Select the node
                        node.select(0, skipSelectAction);
                    }
                } else {
                    this.selectTreeNodeInternal(path, currIndex + 1, node, opId, skipSelectAction).subscribe();
                }
            }
        });
        return observ;
    }
}

