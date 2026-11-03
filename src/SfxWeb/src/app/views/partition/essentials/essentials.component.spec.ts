import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { Application } from 'src/app/Models/DataModels/Application';
import { ClusterManifest } from 'src/app/Models/DataModels/Cluster';
import { Partition } from 'src/app/Models/DataModels/Partition';
import { ReplicaOnPartition } from 'src/app/Models/DataModels/Replica';
import { Service } from 'src/app/Models/DataModels/Service';
import { IRawReplicatorStatus } from 'src/app/Models/RawDataTypes';
import { DataService } from 'src/app/services/data.service';
import { MessageService } from 'src/app/services/message.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { SettingsService } from 'src/app/services/settings.service';
import { EssentialsComponent } from './essentials.component';

describe('Partition essentials manifest independence', () => {
  it.each(['failed', 'pending'])('refreshes replicas independently of a %s manifest request', state => {
    const manifestRequest = state === 'failed'
      ? throwError(() => new Error('Manifest unavailable'))
      : new Subject<ClusterManifest>();
    const getClusterManifest = vi.fn(() => manifestRequest);
    const getNodes = vi.fn(() => of({ collection: [] }));
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: RefreshService, useValue: {} },
        { provide: MessageService, useValue: {} },
        { provide: DataService, useValue: {
          getNodes, getClusterManifest, actionsEnabled: () => false, actionsAdvancedEnabled: () => false
        } },
        { provide: SettingsService, useValue: { getNewOrExistingListSettings: () => ({}) } }
      ]
    });
    const component = TestBed.runInInjectionContext(() => new EssentialsComponent());
    const data = TestBed.inject(DataService);
    const service = new Service(data, {
      Id: 'app/service',
      Name: 'fabric:/app/service',
      TypeName: 'ServiceType',
      ManifestVersion: '1',
      ServiceStatus: 'Active',
      HealthState: 'Ok',
      IsServiceGroup: false,
      ServiceKind: 'Stateful',
      HasPersistedState: true
    }, new Application(data));
    component.partition = new Partition(data, {
      ServiceKind: 'Stateful',
      PartitionInformation: {
        Id: 'partition1', ServicePartitionKind: 'Singleton', HighKey: '', LowKey: '', Name: ''
      },
      TargetReplicaSetSize: 3,
      MinReplicaSetSize: 2,
      AuxiliaryReplicaCount: 0,
      InstanceCount: 0,
      HealthState: 'Ok',
      PartitionStatus: 'Ready',
      CurrentConfigurationEpoch: { ConfigurationVersion: 1, DataLossVersion: 0 },
      MinInstanceCount: 0,
      SelfReconfiguringInstanceCount: 0,
      SelfReconfiguringMinInstanceCount: 0,
      LastQuorumLossDurationInSeconds: 0
    }, service);
    const primary = new ReplicaOnPartition(data, {
      Address: '{}',
      HealthState: 'Ok',
      ReplicaId: 'replica1',
      ReplicaRole: 'Primary',
      PreviousReplicaRole: 'None',
      InstanceId: '',
      LastInBuildDurationInSeconds: '0',
      NodeName: 'node1',
      ReplicaStatus: 'Ready',
      ServiceKind: 'Stateful',
      ToBeRemovedReplicaExpirationTimeUtc: '',
      InstanceRole: '',
      PreviousSelfReconfiguringInstanceRole: '',
      SelfReconfiguringInstanceActivationState: '',
      PreviousSelfReconfiguringInstanceActivationState: ''
    }, component.partition);
    const replicatorStatus = new IRawReplicatorStatus();
    replicatorStatus.RemoteReplicators = [];
    primary.detail.raw = {
      PartitionId: 'partition1',
      InstanceId: '',
      ReplicaId: primary.id,
      ReadStatus: 'Granted',
      WriteStatus: 'Granted',
      CurrentServiceOperation: 'None',
      CurrentServiceOperationStartTimeUtc: '',
      CurrentReplicatorOperation: 'None',
      ReportedLoad: [],
      ReplicatorStatus: replicatorStatus,
      ReplicaStatus: {
        Kind: 'KeyValueStore',
        ProviderKind: 'ESE',
        DatabaseRowCountEstimate: '1',
        DatabaseLogicalSizeEstimate: '2097152',
        StatusDetails: ''
      }
    };
    component.partition.replicas.collection = [primary];
    const refreshHealth = vi.spyOn(component.partition.health, 'refresh').mockReturnValue(of(null));
    const refreshReplicas = vi.spyOn(component.partition.replicas, 'refresh').mockReturnValue(of(true));
    const refreshPrimary = vi.spyOn(primary.detail, 'refresh').mockReturnValue(of(null));

    let completed = false;
    let failure: unknown;
    const subscription = component.refresh().subscribe({
      complete: () => completed = true,
      error: error => failure = error
    });
    try {
      expect(failure).toBeUndefined();
      expect(completed).toBe(true);
      expect(component.replicaViewModels).toHaveLength(1);
      expect(component.replicaViewModels[0].id).toBe(primary.id);
      expect(component.primaryReplica?.id).toBe(primary.id);
      expect(refreshHealth).toHaveBeenCalledOnce();
      expect(refreshReplicas).toHaveBeenCalledOnce();
      expect(refreshPrimary).toHaveBeenCalledOnce();
      expect(getClusterManifest).not.toHaveBeenCalled();
    } finally {
      subscription.unsubscribe();
      component.ngOnDestroy();
    }
  });
});
