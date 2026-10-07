import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { NodeEvent } from 'src/app/Models/eventstore/Events';
import { IFabricProcessResourceUsageSample } from 'src/app/Models/eventstore/FabricProcessResourceUsage';
import { MessageService } from 'src/app/services/message.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { SettingsService } from 'src/app/services/settings.service';
import { DataService } from 'src/app/services/data.service';
import { FabricProcessResourceUsageCapabilityService } from 'src/app/services/fabric-process-resource-usage-capability.service';
import { AllNodesComponent } from './all-nodes.component';

describe('AllNodesComponent', () => {
  const getNodeEvents = vi.fn();
  const node: { name: string; resourceUsage?: IFabricProcessResourceUsageSample } = {
    name: '_nt_0'
  };
  const nodes = { collection: [node] };

  beforeEach(() => {
    getNodeEvents.mockReset();
    node.resourceUsage = undefined;
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
    component.nodes = nodes as AllNodesComponent['nodes'];

    component['refreshResourceUsage']();
    component['refreshResourceUsage']();

    expect(firstRequest.observers).toHaveLength(0);
    firstRequest.next([createResourceUsageEvent(1)]);
    expect(node.resourceUsage).toBeUndefined();

    secondRequest.next([createResourceUsageEvent(2)]);
    expect(node.resourceUsage?.cpuPercent).toBe(2);

    fixture.destroy();
  });
});

function createResourceUsageEvent(cpuUsagePercent: number): NodeEvent {
  const event = new NodeEvent();
  event.fillFromJSON({
    Kind: 'FabricProcessResourceUsage',
    NodeName: '_nt_0',
    CpuUsagePercent: cpuUsagePercent,
    MemoryRssBytes: 100,
    MemoryTotalBytes: 1000,
    SampleDurationMs: 300000,
    TimeStamp: new Date(Date.now() - 1000).toISOString(),
    EventInstanceId: '00000000-0000-0000-0000-000000000001'
  });
  return event;
}
