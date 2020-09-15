import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RepairTasksComponent } from './repair-tasks.component';
import { SettingsService } from 'src/app/services/settings.service';
import { ListColumnSetting, ListSettings } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { RestClientService } from 'src/app/services/rest-client.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, of } from 'rxjs';
import { IRawRepairTask } from 'src/app/Models/RawDataTypes';
import { RefreshService } from 'src/app/services/refresh.service';
import { RouterTestingModule } from '@angular/router/testing';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';

describe('RepairTasksComponent', () => {
  let component: RepairTasksComponent;
  let fixture: ComponentFixture<RepairTasksComponent>;

  let settingsStub: Partial<SettingsService>;
  let dataServiceStub: Partial<DataService>;
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

  beforeEach(async(() => {

    settingsStub = {
        getNewOrExistingListSettings(
        listName: string,
        defaultSortProperties: string[] = [],
        columnSettings: ListColumnSetting[] = [],
        secondRowColumnSettings: ListColumnSetting[] = [],
        secondRowCollapsible: boolean = false,
        showSecondRow: (item) => boolean = (item) => true,
        searchable: boolean = true) {

        return new ListSettings(this.paginationLimit, defaultSortProperties, columnSettings, secondRowColumnSettings, secondRowCollapsible, showSecondRow, searchable);
      }
    };

    dataServiceStub = { };
    dataServiceStub.restClient = ({
      getRepairTasks(messageHandler?: IResponseMessageHandler): Observable<IRawRepairTask[]> {
        return of([
        task,
        {
          Scope: {
              Kind: 'Cluster'
          },
          TaskId: 'Azure/PlatformUpdate/21996579-9f27-4fd9-bfab-2ace650d9997/2/4153',
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
    } as any);

    TestBed.configureTestingModule({
      declarations: [ RepairTasksComponent ],
      providers: [{provide: SettingsService, useValue: settingsStub },
                  {provide: DataService, useValue: dataServiceStub },
                  RefreshService],
      imports: [RouterTestingModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepairTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  fit('should create', () => {
    expect(component).toBeTruthy();
    console.log(component);
  });

  fit('repair tasks in proper places', () => {
    expect(component.completedRepairTasks.length).toBe(1);
    expect(component.repairTasks.length).toBe(1);
    expect(component.sortedCompletedRepairTasks.length).toBe(0);
    expect(component.sortedRepairTasks.length).toBe(0);

    const newTask = new RepairTask(task);

    component.sorted([newTask]);

    expect(component.sortedCompletedRepairTasks.length).toBe(1);
    expect(component.sortedRepairTasks.length).toBe(0);

    const newTask2 = new RepairTask({...task});
    newTask2.raw.TaskId = 'test';

    component.sorted([newTask2], false);

    expect(component.sortedCompletedRepairTasks.length).toBe(1);
    expect(component.sortedRepairTasks.length).toBe(1);
  });
});
