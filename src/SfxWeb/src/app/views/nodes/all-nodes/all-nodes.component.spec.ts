import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { Node } from 'src/app/Models/DataModels/Node';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { NodeEvent } from 'src/app/Models/eventstore/Events';
import { ListSettings } from 'src/app/Models/ListSettings';
import { IRawNode } from 'src/app/Models/RawDataTypes';
import { MessageService } from 'src/app/services/message.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { SettingsService } from 'src/app/services/settings.service';
import { DataService } from 'src/app/services/data.service';
import { FabricProcessResourceUsageCapabilityService } from 'src/app/services/fabric-process-resource-usage-capability.service';
import { AllNodesComponent } from './all-nodes.component';

describe('AllNodesComponent', () => {
  const getNodeEvents = vi.fn();
  let node: Node;
  let nodes: NodeCollection;
  let capability: {
    isSupported: boolean;
    canRetry: boolean;
    ensureSupported: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    getNodeEvents.mockReset();
    const dataService = {
      actionsEnabled: () => false,
      restClient: { getNodeEvents }
    } as unknown as DataService;
    node = new Node(dataService, createRawNode());
    nodes = new NodeCollection(dataService);
    nodes.collection = [node];
    capability = {
      isSupported: true,
      canRetry: false,
      ensureSupported: vi.fn(() => of(true))
    };
    TestBed.configureTestingModule({
      declarations: [AllNodesComponent],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: RefreshService, useValue: {} },
        { provide: MessageService, useValue: {} },
        { provide: SettingsService, useValue: {} },
        {
          provide: DataService,
          useValue: {
            nodes,
            restClient: { getNodeEvents }
          }
        },
        {
          provide: FabricProcessResourceUsageCapabilityService,
          useValue: capability
        }
      ]
    }).overrideComponent(AllNodesComponent, { set: { template: '' } });
  });

  it('reuses an in-flight resource request when a newer refresh starts', () => {
    const request = new Subject<NodeEvent[]>();
    getNodeEvents.mockReturnValue(request);

    const fixture = TestBed.createComponent(AllNodesComponent);
    const component = fixture.componentInstance;
    component.nodes = nodes;

    component['refreshResourceUsage']();
    component['refreshResourceUsage']();

    expect(getNodeEvents).toHaveBeenCalledOnce();
    expect(request.observers).toHaveLength(1);
    request.next([createResourceUsageEvent(2)]);
    expect(node.resourceUsage?.cpuPercent).toBe(2);

    fixture.destroy();
  });

  it('limits completed resource requests to once every five minutes', () => {
    let now = Date.now();
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);
    getNodeEvents.mockReturnValue(of([createResourceUsageEvent(2)]));

    try {
      const fixture = TestBed.createComponent(AllNodesComponent);
      const component = fixture.componentInstance;
      component.nodes = nodes;

      component['refreshResourceUsage']();
      now += 5 * 60 * 1000 - 1;
      component['refreshResourceUsage']();
      expect(getNodeEvents).toHaveBeenCalledOnce();

      now += 1;
      component['refreshResourceUsage']();
      expect(getNodeEvents).toHaveBeenCalledTimes(2);

      fixture.destroy();
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('applies the five-minute interval after a failed resource request', () => {
    let now = Date.now();
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);
    getNodeEvents
      .mockReturnValueOnce(throwError(() => new Error('EventStore unavailable')))
      .mockReturnValueOnce(of([createResourceUsageEvent(2)]));

    try {
      const fixture = TestBed.createComponent(AllNodesComponent);
      const component = fixture.componentInstance;
      component.nodes = nodes;

      component['refreshResourceUsage']();
      component['refreshResourceUsage']();
      expect(getNodeEvents).toHaveBeenCalledOnce();

      now += 5 * 60 * 1000;
      component['refreshResourceUsage']();
      expect(getNodeEvents).toHaveBeenCalledTimes(2);
      expect(node.resourceUsage?.cpuPercent).toBe(2);

      fixture.destroy();
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('ignores a newer sample from a previous node instance', () => {
    const request = new Subject<NodeEvent[]>();
    getNodeEvents.mockReturnValue(request);

    const fixture = TestBed.createComponent(AllNodesComponent);
    const component = fixture.componentInstance;
    component.nodes = nodes;

    component['refreshResourceUsage']();
    request.next([
      createResourceUsageEvent(90, '1', 500),
      createResourceUsageEvent(20, '2', 1000)
    ]);

    expect(node.resourceUsage?.cpuPercent).toBe(20);

    fixture.destroy();
  });

  it('retries capability detection from a later refresh when due', () => {
    getNodeEvents.mockReturnValue(of([createResourceUsageEvent(20)]));
    capability.isSupported = false;
    capability.canRetry = true;
    capability.ensureSupported.mockImplementation(() => {
      capability.isSupported = true;
      capability.canRetry = false;
      return of(true);
    });
    const fixture = TestBed.createComponent(AllNodesComponent);
    const component = fixture.componentInstance;
    component.nodes = nodes;
    component.listSettings = new ListSettings(15, ['name'], 'nodes', []);
    component['hasRefreshed'] = true;

    component['refreshResourceUsage']();

    expect(capability.ensureSupported).toHaveBeenCalledOnce();
    expect(getNodeEvents).toHaveBeenCalledOnce();
    expect(node.resourceUsage?.cpuPercent).toBe(20);
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

function createResourceUsageEvent(cpuUsagePercent: number, nodeInstance = '2', ageMs = 1000): NodeEvent {
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
    EventInstanceId: '00000000-0000-0000-0000-000000000001'
  });
  return event;
}
