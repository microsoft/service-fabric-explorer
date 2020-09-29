import { ITextAndBadge } from '../Utils/ValueResolver';
import { ListSettings } from '../Models/ListSettings';
import { IClusterHealthChunkQueryDescription, IClusterHealthChunk } from '../Models/HealthChunkRawDataTypes';
import { Observable } from 'rxjs';
import { ActionCollection } from '../Models/ActionCollection';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export interface ITreeNode {
    displayName: () => string;
    nodeId: string;
    childrenQuery?: () => Observable<ITreeNode[]>;
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
    mergeClusterHealthStateChunk?: (clusterHealthChunk: IClusterHealthChunk) => Observable<any>;
    canExpandAll?: boolean;
}


