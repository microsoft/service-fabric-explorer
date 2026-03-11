// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { IRawReplicaOnPartition } from '../Models/RawDataTypes';
import { ReplicaRoles } from '../Common/Constants';

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
 * (i.e. Primary or ActiveSecondary).
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
 * Returns the write quorum size for a set of replicas.
 */
export function calculateWriteQuorum(replicas: IRawReplicaOnPartition[]): number {
    return Math.floor(getQuorumReplicas(replicas).size / 2) + 1;
}
