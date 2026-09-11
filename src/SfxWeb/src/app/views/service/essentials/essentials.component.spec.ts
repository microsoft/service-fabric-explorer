import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Application } from 'src/app/Models/DataModels/Application';
import { Service } from 'src/app/Models/DataModels/Service';
import { IRawPartition, IRawService, IRawServiceDescription, IRawServiceHealth } from 'src/app/Models/RawDataTypes';
import { DataService } from 'src/app/services/data.service';
import { ExperienceService } from 'src/app/services/experience.service';
import { MessageService } from 'src/app/services/message.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { RestClientService } from 'src/app/services/rest-client.service';
import { SettingsService } from 'src/app/services/settings.service';
import { EssentialsComponent } from './essentials.component';

describe('Service Essentials description refresh', () => {
  let component: EssentialsComponent;
  let descriptionResponse: Subject<IRawServiceDescription>;
  let healthResponse: Subject<IRawServiceHealth>;
  let partitionsResponse: Subject<IRawPartition[]>;
  let restClient: jasmine.SpyObj<RestClientService>;
  let messageHandler: jasmine.SpyObj<IResponseMessageHandler>;

  const health: IRawServiceHealth = {
    Name: 'fabric:/app/service',
    AggregatedHealthState: 'Error',
    PartitionHealthStates: [],
    HealthEvents: [],
    UnhealthyEvaluations: [],
    HealthStatistics: {
      HealthStateCountList: [
        { EntityKind: 'Partition', HealthStateCount: { OkCount: 3, WarningCount: 2, ErrorCount: 1 } },
        { EntityKind: 'Replica', HealthStateCount: { OkCount: 9, WarningCount: 4, ErrorCount: 2 } }
      ]
    }
  };
  const partition = {
    ServiceKind: 'Stateful',
    PartitionInformation: { Id: 'partition-1', ServicePartitionKind: 'Singleton' },
    HealthState: 'Ok',
    PartitionStatus: 'Ready'
  } as IRawPartition;

  beforeEach(() => {
    descriptionResponse = new Subject<IRawServiceDescription>();
    healthResponse = new Subject<IRawServiceHealth>();
    partitionsResponse = new Subject<IRawPartition[]>();
    restClient = jasmine.createSpyObj<RestClientService>('restClient', [
      'getServiceDescription', 'getServiceHealth', 'getPartitions'
    ]);
    restClient.getServiceDescription.and.returnValue(descriptionResponse);
    restClient.getServiceHealth.and.returnValue(healthResponse);
    restClient.getPartitions.and.returnValue(partitionsResponse);
    messageHandler = jasmine.createSpyObj<IResponseMessageHandler>('messageHandler', ['getSuccessMessage', 'getErrorMessage']);
    const data = {
      restClient,
      actionsEnabled: () => false,
      apps: { ensureInitialized: () => of(true) }
    } as unknown as DataService;

    TestBed.configureTestingModule({
      providers: [
        { provide: DataService, useValue: data },
        { provide: ExperienceService, useValue: { isNew: signal(true) } },
        { provide: SettingsService, useValue: {} },
        { provide: ActivatedRoute, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: RefreshService, useValue: {} },
        { provide: MessageService, useValue: messageHandler }
      ]
    });
    component = TestBed.runInInjectionContext(() => new EssentialsComponent());
    component.service = new Service(data, {
      Id: 'app/service', ManifestVersion: '1.0', TypeName: 'ServiceType',
      ServiceStatus: 'Active', ServiceKind: 'Stateful'
    } as IRawService, { id: 'app' } as Application);
  });

  for (const experience of ['Classic', 'New']) {
    it(`updates delayed health counts and partitions after a description error in ${experience}`, () => {
      component.experience.isNew.set(experience === 'New');
      const next = jasmine.createSpy('next');
      const error = jasmine.createSpy('error');
      const complete = jasmine.createSpy('complete');
      const refresh = component.refresh(messageHandler);

      // Base refresh starts requests eagerly, before the forkJoin subscription.
      expect(restClient.getServiceDescription).toHaveBeenCalledWith('app', 'app/service', messageHandler);
      expect(restClient.getServiceHealth.calls.mostRecent().args[4]).toBe(messageHandler);
      expect(restClient.getPartitions).toHaveBeenCalledWith('app', 'app/service', messageHandler);
      const subscription = refresh.subscribe({ next, error, complete });

      descriptionResponse.error(new Error('Description unavailable'));
      expect(error).not.toHaveBeenCalled();
      expect(complete).not.toHaveBeenCalled();
      expect(component.partitionsDashboard).toBeUndefined();
      expect(component.replicasDashboard).toBeUndefined();

      healthResponse.next(health);
      healthResponse.complete();
      partitionsResponse.next([partition]);
      partitionsResponse.complete();

      expect(component.partitionsDashboard?.count).toBe(6);
      expect(component.partitionsDashboard?.dataPoints.map(point => point.count)).toEqual([1, 2, 3]);
      expect(component.replicasDashboard?.count).toBe(15);
      expect(component.replicasDashboard?.dataPoints.map(point => point.count)).toEqual([2, 4, 9]);
      expect(component.service.partitions.lastRefreshWasSuccessful).toBeTrue();
      expect(component.service.partitions.isInitialized).toBeTrue();
      expect(component.service.partitions.collection.map(item => item.raw)).toEqual([partition]);
      expect(next).toHaveBeenCalledWith([null, undefined, true]);
      expect(complete).toHaveBeenCalledTimes(1);
      expect(error).not.toHaveBeenCalled();
      subscription.unsubscribe();
    });
  }

  it('updates the overview when the description refresh succeeds', () => {
    component.service.description.update({
      ServiceKind: 'Stateful', MinReplicaSetSize: 1, TargetReplicaSetSize: 2,
      PlacementConstraints: 'OldConstraint'
    } as IRawServiceDescription);
    const complete = jasmine.createSpy('complete');
    const subscription = component.refresh(messageHandler).subscribe({ error: fail, complete });
    expect(component.overviewItems).toContain(jasmine.objectContaining({ displayText: 'OldConstraint' }));

    descriptionResponse.next({
      ServiceKind: 'Stateful', MinReplicaSetSize: 3, TargetReplicaSetSize: 5,
      PlacementConstraints: 'NodeType == backend'
    } as IRawServiceDescription);
    descriptionResponse.complete();

    expect(component.overviewItems.slice(0, 3)).toEqual(component.essentialItems);
    expect(component.overviewItems.slice(3)).toEqual([
      { descriptionName: 'Service Kind', displayText: 'Stateful' },
      { descriptionName: 'Minimum Replica Set Size', displayText: '3' },
      { descriptionName: 'Target Replica Set Size', displayText: '5' },
      jasmine.objectContaining({ descriptionName: 'Placement Constraints', displayText: 'NodeType == backend' })
    ]);
    healthResponse.next(health);
    healthResponse.complete();
    partitionsResponse.next([partition]);
    partitionsResponse.complete();
    expect(complete).toHaveBeenCalledTimes(1);
    subscription.unsubscribe();
  });
});
