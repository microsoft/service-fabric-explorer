import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { Node } from 'src/app/Models/DataModels/Node';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { NodeEvent } from 'src/app/Models/eventstore/Events';
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

  beforeEach(() => {
    getNodeEvents.mockReset();
    const dataService = {
      actionsEnabled: () => false,
      restClient: { getNodeEvents }
    } as unknown as DataService;
    node = new Node(dataService, createRawNode());
    nodes = new NodeCollection(dataService);
    nodes.collection = [node];
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
          useValue: { isSupported: true }
        }
      ]
    }).overrideComponent(AllNodesComponent, { set: { template: '' } });
  });

  it('cancels an older resource request when a newer refresh starts', () => {
    const firstRequest = new Subject<NodeEvent[]>();
    const secondRequest = new Subject<NodeEvent[]>();
    getNodeEvents
      .mockReturnValueOnce(firstRequest)
      .mockReturnValueOnce(secondRequest);

    const fixture = TestBed.createComponent(AllNodesComponent);
    const component = fixture.componentInstance;
    component.nodes = nodes;

    component['refreshResourceUsage']();
    component['refreshResourceUsage']();

    expect(firstRequest.observers).toHaveLength(0);
    firstRequest.next([createResourceUsageEvent(1)]);
    expect(node.resourceUsage).toBeUndefined();

    secondRequest.next([createResourceUsageEvent(2)]);
    expect(node.resourceUsage?.cpuPercent).toBe(2);

    fixture.destroy();
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
