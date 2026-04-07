// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { IRawReplicaOnPartition } from '../Models/RawDataTypes';
import { ReplicaRoles, NodeStatusConstants } from '../Common/Constants';

/**
 * Returns true if any replica has a PreviousReplicaRole, indicating the
 * partition is mid-reconfiguration and the PC (previous configuration) set
 * should be used instead of the CC (current configuration) set.
 */
export function isInReconfiguration(replicas: IRawReplicaOnPartition[]): boolean {
    // If the previous configuration (PC) role is 'None' for all replicas, then the partition is not in reconfiguration.
    return replicas.some(r => r.PreviousReplicaRole !== ReplicaRoles.None);
}

/**
 * Returns true if the given role counts toward write quorum
 */
export function isActiveRole(role: string): boolean {
    return role === ReplicaRoles.Primary || role === ReplicaRoles.ActiveSecondary;
}

/**
 * Returns the set of replica ids that count toward the partition write quorum.
 */
export function getQuorumReplicas(replicas: IRawReplicaOnPartition[]): Set<string> {
    // If the partition is not in reconfiguration, write quorum is calculated using the current configuration (CC) role.
    // Otherwise, it is calculated using the PC role.
    const inReconfig = isInReconfiguration(replicas);
    const ids = new Set<string>();
    replicas.forEach(r => {
        const role = inReconfig ? r.PreviousReplicaRole : r.ReplicaRole;
        if (isActiveRole(role)) {
            ids.add(r.ReplicaId);
        }
    });
    return ids;
}

/**
 * Returns the write quorum for a partition.
 */
export function calculateWriteQuorum(replicas: IRawReplicaOnPartition[]): number {
    return Math.floor(getQuorumReplicas(replicas).size / 2) + 1;
}

/**
 * Returns a basic mitigation hint for a down replica based on node status.
 */
export function getDownReplicaMitigationHint(nodeStatus: string): string {
    if (nodeStatus === NodeStatusConstants.Down) {
        return 'Node is down. Please recover the node.';
    } else if (nodeStatus === NodeStatusConstants.Disabling || nodeStatus === NodeStatusConstants.Disabled) {
        return 'Node is in deactivated state. Please enable the node.';
    } else if (nodeStatus === NodeStatusConstants.Up) {
        return 'Node is up but replica is not ready. Please bring the replica back up.';
    }
    return '';
}
