//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface ITreeNode {
        displayName: () => string;
        nodeId?: string;
        childrenQuery?: () => angular.IPromise<ITreeNode[]>;
        selectAction?: () => void;
        badge?: () => ITextAndBadge;
        alwaysVisible?: boolean;
        startExpanded?: boolean;
        sortBy?: () => any[];
        listSettings?: ListSettings;
        actions?: ActionCollection;
        // If current node is expanded, update the health chunk query to include health status queries for its children.
        addHealthStateFiltersForChildren?: (clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription) => void;
        // If current node is expanded, merge the health chunk data back to the data models for current node and its children.
        mergeClusterHealthStateChunk?: (clusterHealthChunk: IClusterHealthChunk) => angular.IPromise<any>;
        canExpandAll?: boolean;
    }
}

