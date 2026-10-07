import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { Node } from 'src/app/Models/DataModels/Node';
import { NodeEvent } from 'src/app/Models/eventstore/Events';
import { IRawNode } from 'src/app/Models/RawDataTypes';
import { DataService } from 'src/app/services/data.service';
import { FabricProcessResourceUsageCapabilityService } from 'src/app/services/fabric-process-resource-usage-capability.service';
import { MessageService } from 'src/app/services/message.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { SettingsService } from 'src/app/services/settings.service';
import { EssentialsComponent } from './essentials.component';

describe('EssentialsComponent resource usage', () => {
  it('ignores a newer sample from a previous node instance', async () => {
    const getNodeEvents = vi.fn(() => of([
      createResourceUsageEvent(90, '1', 500),
      createResourceUsageEvent(20, '2', 1000)
    ]));
    const dataService = {
      actionsEnabled: () => false,
      restClient: { getNodeEvents }
    } as unknown as DataService;

    TestBed.configureTestingModule({
      declarations: [EssentialsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: RefreshService, useValue: {} },
        { provide: MessageService, useValue: {} },
        { provide: SettingsService, useValue: {} },
        { provide: DataService, useValue: dataService },
        {
          provide: FabricProcessResourceUsageCapabilityService,
          useValue: { isSupported: true }
        }
      ]
    }).overrideComponent(EssentialsComponent, { set: { template: '' } });

    const fixture = TestBed.createComponent(EssentialsComponent);
    const component = fixture.componentInstance;
    component.nodeName = '_nt_0';
    component.node = new Node(dataService, createRawNode());

    await firstValueFrom(component['loadResourceUsage']());

    expect(component.resourceUsage?.cpuPercent).toBe(20);
    fixture.destroy();
  });
});

function createRawNode(): IRawNode {
  return {
    Name: '_nt_0',
    IpAddressOrFQDN: 'localhost',
    Type: 'nt',
    CodeVersion: '',
    ConfigVersion: '',
    NodeStatus: 'Up',
    NodeUpTimeInSeconds: '60',
    HealthState: 'Ok',
    IsSeedNode: false,
    UpgradeDomain: '0',
    FaultDomain: 'fd:/0',
    Id: { Id: 'node-id-0' },
    InstanceId: '2',
    NodeDeactivationInfo: {
      NodeDeactivationIntent: 'Invalid',
      NodeDeactivationStatus: 'None',
      NodeDeactivationTask: [],
      PendingSafetyChecks: []
    },
    IsStopped: false,
    NodeDownTimeInSeconds: '0',
    NodeUpAt: new Date(Date.now() - 60_000).toISOString(),
    NodeDownAt: '',
    NodeTags: []
  };
}

function createResourceUsageEvent(cpuUsagePercent: number, nodeInstance: string, ageMs: number): NodeEvent {
  const event = new NodeEvent();
  event.fillFromJSON({
    Kind: 'FabricProcessResourceUsage',
    NodeName: '_nt_0',
    NodeId: 'node-id-0',
    NodeInstance: nodeInstance,
    CpuUsagePercent: cpuUsagePercent,
    MemoryRssBytes: 100,
    MemoryTotalBytes: 1000,
    SampleDurationMs: 300000,
    TimeStamp: new Date(Date.now() - ageMs).toISOString(),
    EventInstanceId: `${nodeInstance}-${cpuUsagePercent}`
  });
  return event;
}
