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
    public orderbyHealthState = false;

    public firstTreeSelect = true;

    public get isLoading(): boolean {
        return !this.childGroupViewModel ||
            (this.childGroupViewModel.children.length === 0 && this.childGroupViewModel.loadingChildren);
    }

    public get isEmpty(): boolean {
        return this.childGroupViewModel &&
            !this.childGroupViewModel.children.length;
    }

    private childrenQuery: () => Observable<ITreeNode[]>;
    private selectTreeNodeOpId = 1;

    constructor(childrenQuery: () => Observable<ITreeNode[]>) {
        this.childrenQuery = childrenQuery;
        this.refreshChildren();
    }

    public refreshChildren() {
        const baseNode: ITreeNode = {childrenQuery: this.childrenQuery,
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
            this.selectedNode.selectedObservable.next(false);
        }

        if (node) {
            node.selected = true;
            node.selectedObservable.next(true);
        }

        this.selectedNode = node;
        return true;
    }

    public onKeyDown(event: KeyboardEvent) {
        const selectedNode = this.selectedNode;
        switch (event.key) {
            case 'ArrowDown': // Down
                this.selectedNode.selectNext();
                break;
            case 'ArrowUp': // Up
                this.selectedNode.selectPrevious();
                break;
            case 'ArrowRight': // Right
                this.selectedNode.expandOrMoveToChild();
                break;
            case 'ArrowLeft': // Left
                this.selectedNode.collapseOrMoveToParent();
                break;
            case 'Home':
                this.selectedNode.selectRoot();
                break;
            case 'End':
                this.selectedNode.selectEnd();
                break;
            case 'Enter':
                this.selectedNode.navigateTo();
                break;
            case '*':
                this.selectedNode.expandAllSiblings();
                break;
            case /^[a-z]$/i.test(event.key) && event.key: // Alphanumeric
                this.selectedNode.typeAheadSearch(event.key);
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
        this.selectTreeNodeOpId++;
        const opId = this.selectTreeNodeOpId;
        return this.selectTreeNodeInternal(path, 0, this.childGroupViewModel, opId, skipSelectAction);
    }

    public addHealthChunkFiltersRecursively(clusterHealthQueryDescription: IClusterHealthChunkQueryDescription): IClusterHealthChunkQueryDescription {
        this.childGroupViewModel.updateHealthChunkQueryRecursively(clusterHealthQueryDescription);
        return clusterHealthQueryDescription;
    }

    public mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): Observable<any[]> {
        return this.childGroupViewModel.updateDataModelFromHealthChunkRecursively(clusterHealthChunk);
    }

    private selectTreeNodeInternal(path: string[], currIndex: number, group: TreeNodeGroupViewModel, opId: number, skipSelectAction?: boolean): Observable<void> {
        const observ = group.expand();
        observ.subscribe(() => {
            if (opId !== this.selectTreeNodeOpId) {
                return;
            }

            let node: TreeNodeGroupViewModel = null;
            const nodes = group.children;
            for (const n of nodes) {
                if (n.nodeId === path[currIndex]) {
                    node = n;
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
                        node.select();
                        if(!skipSelectAction){
                            node.navigateTo();
                        }
                    }
                } else {
                    this.selectTreeNodeInternal(path, currIndex + 1, node, opId, skipSelectAction).subscribe();
                }
            }
        });
        return observ;
    }
}

