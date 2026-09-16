import { Component, Input, OnChanges, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReplicaOnPartition } from 'src/app/Models/DataModels/Replica';
import { IRawRemoteReplicatorStatus } from 'src/app/Models/RawDataTypes';

export interface IInBuildReplicaItem {
  replicator: IRawRemoteReplicatorStatus;
  replica: ReplicaOnPartition | undefined;
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

  sub = new Subscription();

  ngOnChanges(): void {
    this.primaryReplica = this.replicas?.find(replica => replica.raw.ReplicaRole === 'Primary');

    if (this.primaryReplica) {
      this.sub.add(this.primaryReplica.detail.refresh().subscribe(() => {
        const remoteReplicators = this.primaryReplica?.detail.raw.ReplicatorStatus?.RemoteReplicators || [];

        this.inBuildItems = remoteReplicators
          .filter(replicator => replicator.IsInBuild)
          .map(replicator => ({
            replicator,
            replica: this.replicas.find(replica => replica.id === replicator.ReplicaId)
          }));
      }));
    }
  }

  paneTitle(item: IInBuildReplicaItem): string {
    return `Replica ${item.replicator.ReplicaId}`;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
