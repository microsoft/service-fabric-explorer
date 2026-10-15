import { Component, Input, OnChanges, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReplicaOnPartition } from 'src/app/Models/DataModels/Replica';
import { IRawRemoteReplicatorStatus } from 'src/app/Models/RawDataTypes';
import { IProgressStatus } from 'src/app/shared/component/phase-diagram/phase-diagram.component';

export interface IInBuildReplicaItem {
  replicator: IRawRemoteReplicatorStatus;
  // Parent-owned mirror of the child app-replica-build-progress's phases/currentIndex, fed via
  // (phasesChange) -- lets the header stepper bind here instead of reading the child's instance.
  phases: IProgressStatus[];
  currentIndex: number;
}

@Component({
    selector: 'app-replicas-in-build',
    templateUrl: './replicas-in-build.component.html',
    styleUrls: ['./replicas-in-build.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ReplicasInBuildComponent implements OnChanges, OnDestroy {
  @Input() replicas!: ReplicaOnPartition[];

  primaryReplica: ReplicaOnPartition | undefined;
  inBuildItems: IInBuildReplicaItem[] = [];
  outerCollapsed = true;
  // Partition-level, not per-replica -- a service is either ESE-backed KVS or not, uniformly
  // across every replica, known well before any of them finish copying. KVS can also be
  // TStore-backed (FABRIC_KEY_VALUE_STORE_PROVIDER_KIND_TSTORE); that provider's copy detail
  // struct isn't implemented server-side, so it never populates the ESE-shaped fields either.
  isEseBackedKvs = false;

  sub = new Subscription();

  ngOnChanges(): void {
    this.primaryReplica = this.replicas?.find(replica => replica.raw.ReplicaRole === 'Primary');

    if (!this.primaryReplica) {
      // No primary right now -- drop the stale list and subscription rather than leaving the
      // panel showing the last primary's data (and the old subscription able to repopulate it).
      this.sub.unsubscribe();
      this.sub = new Subscription();
      this.inBuildItems = [];
      this.isEseBackedKvs = false;
      return;
    }

    this.sub.add(this.primaryReplica.detail.refresh().subscribe(() => {
      const remoteReplicators = this.primaryReplica?.detail.raw.ReplicatorStatus?.RemoteReplicators || [];
      const replicaStatus = this.primaryReplica?.detail.raw.ReplicaStatus;
      this.isEseBackedKvs = replicaStatus?.Kind === 'KeyValueStore' && replicaStatus?.ProviderKind === 'ESE';

      this.inBuildItems = remoteReplicators
        // IsInBuild lags CopyComplete by one refresh -- exclude it so a replica that
        // has already finished building doesn't linger in this list.
        .filter(replicator => replicator.IsInBuild && replicator.RemoteInbuildReplicaStatus?.InbuildPhase !== 'CopyComplete')
        .map(replicator => ({
          replicator,
          phases: [],
          currentIndex: 0,
        }));
    }));
  }

  paneTitle(item: IInBuildReplicaItem): string {
    return item.replicator.ReplicaId;
  }

  // Fed by app-replica-build-progress's (phasesChange) -- keeps the header stepper's data
  // parent-owned instead of read off the child's instance via template reference.
  onProgressChange(item: IInBuildReplicaItem, event: { phases: IProgressStatus[]; currentIndex: number }): void {
    item.phases = event.phases;
    item.currentIndex = event.currentIndex;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
