//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class TreeViewModel {
        public childGroupViewModel: TreeNodeGroupViewModel;
        public selectedNode: TreeNodeViewModel;

        public showOkItems: boolean = true;
        public showWarningItems: boolean = true;
        public showErrorItems: boolean = true;

        public searchTerm: string = "";

        public get isLoading(): boolean {
            return !this.childGroupViewModel ||
                (this.childGroupViewModel.children.length === 0 && this.childGroupViewModel.loadingChildren);
        };

        public get isEmpty(): boolean {
            return this.childGroupViewModel &&
                !this.childGroupViewModel.children.length;
        };

        private _childrenQuery: () => angular.IPromise<ITreeNode[]>;
        private _selectTreeNodeOpId: number = 1;

        constructor(public $q: angular.IQService, childrenQuery: () => angular.IPromise<ITreeNode[]>) {
            this._childrenQuery = childrenQuery;
            this.refreshChildren();
        }

        public refreshChildren() {
            this.childGroupViewModel = new TreeNodeGroupViewModel(this, null, this._childrenQuery);
            if (this.childGroupViewModel.isCollapsed) {
                this.childGroupViewModel.toggle();
            }
        }

        public selectNode(node: TreeNodeViewModel): boolean {
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
            let selectedNode = this.selectedNode;
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
        public refresh(): angular.IPromise<any> {
            return this.childGroupViewModel.refreshExpandedChildrenRecursively();
        }

        public selectTreeNode(path: string[], skipSelectAction?: boolean): angular.IPromise<void> {
            this._selectTreeNodeOpId++;
            let opId = this._selectTreeNodeOpId;
            return this.selectTreeNodeInternal(path, 0, this.childGroupViewModel, opId, skipSelectAction);
        }

        public addHealthChunkFiltersRecursively(clusterHealthQueryDescription: IClusterHealthChunkQueryDescription): IClusterHealthChunkQueryDescription {
            this.childGroupViewModel.updateHealthChunkQueryRecursively(clusterHealthQueryDescription);
            return clusterHealthQueryDescription;
        }

        public mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any> {
            return this.childGroupViewModel.updateDataModelFromHealthChunkRecursively(clusterHealthChunk);
        }

        private selectTreeNodeInternal(path: string[], currIndex: number, group: TreeNodeGroupViewModel, opId: number, skipSelectAction?: boolean): angular.IPromise<void> {
            return group.expand().then(() => {
                if (opId !== this._selectTreeNodeOpId) {
                    return;
                }

                let node: TreeNodeViewModel = null;
                let nodes = group.children;
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].nodeId === path[currIndex]) {
                        node = nodes[i];
                        break;
                    }
                }

                if (node) {

                    // Scroll to the page which contains the current node
                    if (node.parent && node.parent.listSettings) {
                        let index = nodes.indexOf(node);
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
                        this.selectTreeNodeInternal(path, currIndex + 1, node.childGroupViewModel, opId, skipSelectAction);
                    }
                }
            });
        }
    }
}
