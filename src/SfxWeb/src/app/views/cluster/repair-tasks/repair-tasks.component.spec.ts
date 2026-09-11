import { CommonModule } from '@angular/common';
import { booleanAttribute, Component, Directive, EventEmitter, inject, Input, OnInit, Output, signal, TemplateRef, ViewContainerRef } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { RepairTasksComponent } from './repair-tasks.component';
import { SettingsService } from 'src/app/services/settings.service';
import { ListSettings } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { RestClientService } from 'src/app/services/rest-client.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, of } from 'rxjs';
import { IRawRepairTask } from 'src/app/Models/RawDataTypes';
import { RefreshService } from 'src/app/services/refresh.service';
import { RouterTestingModule } from '@angular/router/testing';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { RepairTaskCollection } from 'src/app/Models/DataModels/collections/RepairTaskCollection';
import { NgbNavChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { ITimelineData } from 'src/app/Models/eventstore/timelineGenerators';
import { ISortOrdering } from 'src/app/modules/detail-list-templates/detail-list/detail-list.component';
import { ExperienceService } from 'src/app/services/experience.service';
import { StatusWarningService } from 'src/app/services/status-warning.service';

@Component({ selector: 'app-clip-board', template: '', standalone: false })
class ClipBoardStubComponent {
  @Input() text = '';
  @Input() name = '';
}

@Component({ selector: 'app-collapse-container', template: '<ng-content></ng-content>', standalone: false })
class CollapseContainerStubComponent {
  @Input() sectionName = '';
  @Input({ transform: booleanAttribute }) collapsed = false;

  changeCollapseState() {
    this.collapsed = !this.collapsed;
  }
}

@Component({ selector: 'app-detail-list', template: '', standalone: false })
class DetailListStubComponent {
  @Input() list: RepairTask[] = [];
  @Input() listSettings!: ListSettings;
  @Output() sorted = new EventEmitter<RepairTask[]>();
  @Output() sortOrdering = new EventEmitter<ISortOrdering>();
  page = 1;
  resetAll = jasmine.createSpy('resetAll').and.callFake(() => this.listSettings.reset());
  updateList = jasmine.createSpy('updateList');
}

@Component({ selector: 'app-event-navigator', template: '', standalone: false })
class EventNavigatorStubComponent {
  @Input() events!: ITimelineData;
  @Input() heading = '';
  @Input() inspectLabel = '';
  @Output() inspectEvent = new EventEmitter<string>();
}

@Component({ selector: 'app-repair-duration', template: '', standalone: false })
class RepairDurationStubComponent {
  @Input() jobs: RepairTask[] = [];
  @Output() inspectJob = new EventEmitter<string>();
}

@Component({ selector: 'app-dashboard-text-tile', template: '', standalone: false })
class DashboardTextTileStubComponent {
  @Input() barClass = '';
  @Input() count!: string | number;
  @Input() title = '';
}

@Component({ selector: 'app-dashboard-text-scale-tile', template: '<ng-content></ng-content>', standalone: false })
class DashboardTextScaleTileStubComponent {
  @Input() barClass = '';
  @Input() title = '';
}

@Component({ selector: 'app-event-store-timeline', template: '', standalone: false })
class EventStoreTimelineStubComponent {
  @Input() events!: ITimelineData;
  @Input() fitOnDataChange = true;
  @Input() displayMoveToStart = true;
  @Input() displayMoveToEnd = true;
}

@Component({ selector: 'app-repair-job-chart', template: '', standalone: false })
class RepairJobChartStubComponent {
  @Input() jobs: RepairTask[] = [];
  @Input() sortOrder!: ISortOrdering;
}

// eslint-disable-next-line @angular-eslint/directive-selector -- Test double must match the ng-bootstrap selector used by the production template.
@Directive({ selector: '[ngbNav]', exportAs: 'ngbNav', standalone: false })
class NavStubDirective {
  @Input() destroyOnHide = true;
  @Output() navChange = new EventEmitter<NgbNavChangeEvent>();
}

// eslint-disable-next-line @angular-eslint/directive-selector -- Test double must match the ng-bootstrap selectors used by the production template.
@Directive({ selector: '[ngbNavItem], [ngbNavLink]', standalone: false })
class NavItemStubDirective {}

// eslint-disable-next-line @angular-eslint/directive-selector -- Test double must match the ng-bootstrap selector used by the production template.
@Directive({ selector: '[ngbNavContent]', standalone: false })
class NavContentStubDirective implements OnInit {
  private template = inject(TemplateRef<unknown>);
  private container = inject(ViewContainerRef);

  ngOnInit() {
    // Render every tab's content so strict template checks cover both charts.
    this.container.createEmbeddedView(this.template);
  }
}

// eslint-disable-next-line @angular-eslint/directive-selector -- Test double must match the ng-bootstrap selector used by the production template.
@Directive({ selector: '[ngbNavOutlet]', standalone: false })
class NavOutletStubDirective {
  @Input() ngbNavOutlet!: NavStubDirective;
}

describe('RepairTasksComponent', () => {
  let component: RepairTasksComponent;
  let fixture: ComponentFixture<RepairTasksComponent>;

  let dataServiceStub: Partial<DataService>;
  let experienceStub: Pick<ExperienceService, 'isNew'>;
  const task = {
    Scope: {
        Kind: 'Cluster'
    },
    TaskId: 'Azure/PlatformUpdate/21996579-9f27-4fd9-bfab-2ace650d9997/2/4153',
    Version: '132281309100816959',
    Description: '',
    State: 'Completed',
    Flags: 0,
    Action: 'System.Azure.Job.PlatformUpdate',
    Target: {
        Kind: 'Node',
        NodeNames: [
            '_SFRole0_2'
        ]
    },
    Executor: 'fabric:/System/InfrastructureService/SFRole0',
    ExecutorData: '{\r\n  "JobId": "21996579-9f27-4fd9-bfab-2ace650d9997",\r\n  "UD": 2,\r\n  "StepId": "_SFRole0_2"\r\n}',
    Impact: {
        Kind: 'Node',
        NodeImpactList: []
    },
    ResultStatus: 'Succeeded',
    ResultCode: 0,
    ResultDetails: 'Job step completed with status Executed',
    History: {
        CreatedUtcTimestamp: '2020-03-08T08:48:30.081Z',
        ClaimedUtcTimestamp: '2020-03-08T08:48:30.081Z',
        PreparingUtcTimestamp: '2020-03-08T08:48:30.081Z',
        ApprovedUtcTimestamp: '2020-03-08T08:48:30.253Z',
        ExecutingUtcTimestamp: '2020-03-08T08:48:45.183Z',
        RestoringUtcTimestamp: '2020-03-08T09:40:18.906Z',
        CompletedUtcTimestamp: '2020-03-08T09:40:19.079Z',
        PreparingHealthCheckStartUtcTimestamp: '2020-03-08T08:48:30.159Z',
        PreparingHealthCheckEndUtcTimestamp: '2020-03-08T08:48:30.191Z',
        RestoringHealthCheckStartUtcTimestamp: '2020-03-08T09:40:18.999Z',
        RestoringHealthCheckEndUtcTimestamp: '2020-03-08T09:40:19.016Z'
    },
    PreparingHealthCheckState: 'Skipped',
    RestoringHealthCheckState: 'Skipped',
    PerformPreparingHealthCheck: false,
    PerformRestoringHealthCheck: false
  };

  beforeEach(waitForAsync(() => {

    experienceStub = { isNew: signal(true) };
    dataServiceStub = { };
    dataServiceStub.restClient = ({
      getRepairTasks(messageHandler?: IResponseMessageHandler): Observable<IRawRepairTask[]> {
        return of([
        task,
        {
          Scope: {
              Kind: 'Cluster'
          },
          TaskId: 'Azure/PlatformUpdate/pending-task',
          Version: '132281309100816959',
          Description: '',
          State: 'Executing',
          Flags: 0,
          Action: 'System.Azure.Job.PlatformUpdate',
          Target: {
              Kind: 'Node',
              NodeNames: [
                  '_SFRole0_2'
              ]
          },
          Executor: 'fabric:/System/InfrastructureService/SFRole0',
          ExecutorData: '{\r\n  "JobId": "21996579-9f27-4fd9-bfab-2ace650d9997",\r\n  "UD": 2,\r\n  "StepId": "_SFRole0_2"\r\n}',
          Impact: {
              Kind: 'Node',
              NodeImpactList: []
          },
          ResultStatus: 'Succeeded',
          ResultCode: 0,
          ResultDetails: 'Job step completed with status Executed',
          History: {
              CreatedUtcTimestamp: '2020-03-08T08:48:30.081Z',
              ClaimedUtcTimestamp: '2020-03-08T08:48:30.081Z',
              PreparingUtcTimestamp: '2020-03-08T08:48:30.081Z',
              ApprovedUtcTimestamp: '2020-03-08T08:48:30.253Z',
              ExecutingUtcTimestamp: '2020-03-08T08:48:45.183Z',
              RestoringUtcTimestamp: '2020-03-08T09:40:18.906Z',
              CompletedUtcTimestamp: '2020-03-08T09:40:19.079Z',
              PreparingHealthCheckStartUtcTimestamp: '2020-03-08T08:48:30.159Z',
              PreparingHealthCheckEndUtcTimestamp: '2020-03-08T08:48:30.191Z',
              RestoringHealthCheckStartUtcTimestamp: '2020-03-08T09:40:18.999Z',
              RestoringHealthCheckEndUtcTimestamp: '2020-03-08T09:40:19.016Z'
          },
          PreparingHealthCheckState: 'Skipped',
          RestoringHealthCheckState: 'Skipped',
          PerformPreparingHealthCheck: false,
          PerformRestoringHealthCheck: false
      }
        ]);
      }
    } as RestClientService);
    dataServiceStub.repairCollection = new RepairTaskCollection(dataServiceStub as DataService);

    TestBed.configureTestingModule({
      declarations: [
        RepairTasksComponent, ClipBoardStubComponent, CollapseContainerStubComponent,
        DetailListStubComponent, EventNavigatorStubComponent, RepairDurationStubComponent,
        DashboardTextTileStubComponent, DashboardTextScaleTileStubComponent,
        EventStoreTimelineStubComponent, RepairJobChartStubComponent,
        NavStubDirective, NavItemStubDirective, NavContentStubDirective, NavOutletStubDirective
      ],
      providers: [SettingsService,
                  {provide: DataService, useValue: dataServiceStub },
                  {provide: ExperienceService, useValue: experienceStub },
                  RefreshService],
      imports: [CommonModule, RouterTestingModule],
      errorOnUnknownElements: true,
      errorOnUnknownProperties: true
    })
    .compileComponents();
  }));

  beforeEach(() => {
    dataServiceStub.warnings = TestBed.inject(StatusWarningService);
    fixture = TestBed.createComponent(RepairTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('repair tasks in proper places', () => {
    expect(component.repairTaskCollection.repairTasks.length).toBe(1);
    expect(component.repairTaskCollection.completedRepairTasks.length).toBe(1);
    expect(component.sortedCompletedRepairTasks.length).toBe(0);
    expect(component.sortedRepairTasks.length).toBe(0);

    const newTask = new RepairTask(TestBed.inject(DataService), task);

    component.sorted([newTask]);

    expect(component.sortedCompletedRepairTasks.length).toBe(1);
    expect(component.sortedRepairTasks.length).toBe(0);

    const newTask2 = new RepairTask(TestBed.inject(DataService), {...task});
    newTask2.raw.TaskId = 'test';

    component.sorted([newTask2], false);

    expect(component.sortedCompletedRepairTasks.length).toBe(1);
    expect(component.sortedRepairTasks.length).toBe(1);
  });

  for (const isNew of [true, false]) {
    it(`binds the tables and visualizations in the ${isNew ? 'new' : 'classic'} experience`, async () => {
      experienceStub.isNew.set(isNew);
      await fixture.whenStable();

      const [pending, completed] = fixture.debugElement.queryAll(By.directive(DetailListStubComponent))
        .map(element => element.injector.get(DetailListStubComponent));
      expect(pending.list).toBe(component.repairTaskCollection.repairTasks);
      expect(pending.listSettings).toBe(component.repairTaskListSettings);
      expect(completed.list).toBe(component.repairTaskCollection.completedRepairTasks);
      expect(completed.listSettings).toBe(component.completedRepairTaskListSettings);

      pending.sorted.emit(pending.list);
      completed.sorted.emit(completed.list);
      const ordering: ISortOrdering = { direction: true, propertyPath: ['raw.TaskId'], displayPath: 'Task ID' };
      completed.sortOrdering.emit(ordering);
      fixture.detectChanges();

      expect(component.chartJobs).toEqual([...completed.list, ...pending.list]);
      expect(component.ordering).toBe(ordering);
      if (isNew) {
        const navigator = fixture.debugElement.query(By.directive(EventNavigatorStubComponent))
          .injector.get(EventNavigatorStubComponent);
        expect(navigator.events).toBe(component.timelineData);
        expect(navigator.inspectLabel).toBe('Open in repair table');
        expect(fixture.debugElement.query(By.directive(RepairDurationStubComponent))
          .injector.get(RepairDurationStubComponent).jobs).toBe(component.chartJobs);
      } else {
        const timeline = fixture.debugElement.query(By.directive(EventStoreTimelineStubComponent))
          .injector.get(EventStoreTimelineStubComponent);
        expect(timeline.events).toBe(component.timelineData);
        expect(timeline.fitOnDataChange).toBe(false);
        expect(timeline.displayMoveToStart).toBe(false);
        expect(timeline.displayMoveToEnd).toBe(false);

        const chart = fixture.debugElement.query(By.directive(RepairJobChartStubComponent))
          .injector.get(RepairJobChartStubComponent);
        expect(chart.jobs).toBe(component.chartJobs);
        expect(chart.sortOrder).toBe(ordering);
      }
    });
  }

  for (const completed of [false, true]) {
    it(`opens a ${completed ? 'completed timeline' : 'pending duration'} job in its repair table`, fakeAsync(() => {
      const target = (completed ? component.repairTaskCollection.completedRepairTasks : component.repairTaskCollection.repairTasks)[0];
      const other = (completed ? component.repairTaskCollection.repairTasks : component.repairTaskCollection.completedRepairTasks)[0];
      const settings = completed ? component.completedRepairTaskListSettings : component.repairTaskListSettings;
      const otherSettings = completed ? component.repairTaskListSettings : component.completedRepairTaskListSettings;
      const selector = completed ? '[data-cy=completedjobs]' : '.pending-task-results';
      const table = fixture.debugElement.query(By.css(selector));
      const section = table.query(By.directive(CollapseContainerStubComponent)).injector.get(CollapseContainerStubComponent);
      const list = table.query(By.directive(DetailListStubComponent)).injector.get(DetailListStubComponent);
      const scroll = spyOn(table.nativeElement as HTMLElement, 'scrollIntoView');
      section.collapsed = true;
      list.page = 3;
      settings.search = 'old search';
      settings.sortReverse = true;
      otherSettings.search = 'keep this search';

      if (completed) {
        list.sorted.emit([target]);
        fixture.detectChanges();
        fixture.debugElement.query(By.directive(EventNavigatorStubComponent)).injector.get(EventNavigatorStubComponent)
          .inspectEvent.emit(`Executing---${target.raw.TaskId}`);
      } else {
        fixture.debugElement.query(By.directive(RepairDurationStubComponent)).injector.get(RepairDurationStubComponent)
          .inspectJob.emit(target.raw.TaskId);
      }

      expect(section.collapsed).toBe(false);
      expect(target.isSecondRowCollapsed).toBe(false);
      expect(settings.search).toBe(target.raw.TaskId);
      expect(list.resetAll).not.toHaveBeenCalled();
      tick();

      expect(list.resetAll).toHaveBeenCalledTimes(1);
      expect(list.page).toBe(1);
      expect(settings.sortReverse).toBe(false);
      expect(settings.search).toBe(target.raw.TaskId);
      expect(list.updateList).toHaveBeenCalledTimes(1);
      expect(scroll).toHaveBeenCalledWith({ block: 'center' });
      expect(other.isSecondRowCollapsed).toBe(true);
      expect(otherSettings.search).toBe('keep this search');
    }));
  }

  it('ignores navigation to an unknown repair task', fakeAsync(() => {
    component.repairTaskListSettings.search = 'pending search';
    component.completedRepairTaskListSettings.search = 'completed search';

    component.openRepair('Executing---unknown-task');
    tick();

    expect(component.repairTaskListSettings.search).toBe('pending search');
    expect(component.completedRepairTaskListSettings.search).toBe('completed search');
    expect(component.repairTaskCollection.collection.every(item => item.isSecondRowCollapsed)).toBe(true);
    for (const element of fixture.debugElement.queryAll(By.directive(DetailListStubComponent))) {
      const list = element.injector.get(DetailListStubComponent);
      expect(list.resetAll).not.toHaveBeenCalled();
      expect(list.updateList).not.toHaveBeenCalled();
    }
  }));
});
