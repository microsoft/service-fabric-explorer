import { Injectable } from '@angular/core';
import { ListColumnSetting, ListSettings, ListColumnSettingForBadge, ListColumnSettingForLink,
         ListColumnSettingWithCopyText, ListColumnSettingWithUtcTime, ListColumnSettingWithCustomComponent,
         ListColumnSettingWithShorten,
         ListColumnSettingWithFilter} from '../Models/ListSettings';
import { NodeStatusConstants, Constants } from '../Common/Constants';
import { ClusterLoadInformation } from '../Models/DataModels/Cluster';
import { MetricsViewModel } from '../ViewModels/MetricsViewModel';
import { StorageService } from './storage.service';
import { QuestionToolTipComponent } from '../modules/detail-list-templates/question-tool-tip/question-tool-tip.component';
import { RepairTaskViewComponent } from '../modules/repair-tasks/repair-task-view/repair-task-view.component';
import { ListColumnSettingForApplicationType } from '../views/application-type/action-row/action-row.component';
import { HtmlUtils } from '../Utils/HtmlUtils';
import { ReplaySubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private listSettings: Record<string, ListSettings>;
  private iPaginationLimit: number;
  private iMetricsViewModel: MetricsViewModel;
  private sessionVariables: { [key: string]: any } = {};

  public treeWidth: ReplaySubject<string> = new ReplaySubject(1);

  public get paginationLimit(): number {
      return this.iPaginationLimit;
  }

  public set paginationLimit(limit: number) {
      if (!limit) {
          return;
      }
      if (limit < Constants.PaginationLimitMin) {
          limit = Constants.PaginationLimitMin;
      } else if (limit > Constants.PaginationLimitMax) {
          limit = Constants.PaginationLimitMax;
      }
      this.iPaginationLimit = limit;
      this.storage.setValue(Constants.PaginationLimitStorageKey, limit);
      this.updatePaginationLimit(limit);
  }

  public constructor(private storage: StorageService) {
      this.listSettings = {};
      this.iPaginationLimit = storage.getValueNumber(Constants.PaginationLimitStorageKey, Constants.DefaultPaginationLimit);
    }

  public getNewOrExistingMetricsViewModel(clusterLoadInformation: ClusterLoadInformation): MetricsViewModel {
      if (!this.iMetricsViewModel) {
          this.iMetricsViewModel = new MetricsViewModel(clusterLoadInformation);
      }
      return this.iMetricsViewModel;
  }

  public getNewOrExistingListSettings(
      listName: string,
      defaultSortProperties: string[] = [],
      columnSettings: ListColumnSetting[] = [],
      secondRowColumnSettings: ListColumnSetting[] = [],
      secondRowCollapsible: boolean = false,
      showSecondRow: (item) => boolean = (item) => true,
      searchable: boolean = true) {

      // Use URL + listName as unique key to track list settings on detail pages
      const key: string = listName; // TODO fix this this.$location.path() + "/" + listName;
      if (!this.listSettings[key]) {
          this.listSettings[key] = new ListSettings(this.paginationLimit, defaultSortProperties, listName, columnSettings, secondRowColumnSettings, secondRowCollapsible, showSecondRow, searchable);
      }
      return this.listSettings[key];
  }

  public getNewOrExistingTreeNodeListSettings(
      listKey: string,
      defaultSortProperties: string[] = [],
      columnSettings: ListColumnSetting[] = []) {

      if (!this.listSettings[listKey]) {
          this.listSettings[listKey] = new ListSettings(this.paginationLimit, defaultSortProperties, 'Tree Node', columnSettings);
      }
      return this.listSettings[listKey];
  }

  public getNewOrExistingUnhealthyEvaluationsListSettings(listKey: string = 'unhealthy Evaluations') {
      return this.getNewOrExistingListSettings(listKey, null,
          [
              new ListColumnSettingForLink('kind', 'Kind', (item) =>  item.viewPath),
              new ListColumnSettingForBadge('healthState', 'Health State'),
              new ListColumnSettingWithCopyText('description', 'Description'),
              new ListColumnSettingWithUtcTime('sourceTimeStamp', 'Source UTC'),
          ]);
  }

  public getNewOrExistingHealthEventsListSettings(listKey: string = 'health Events') {
      return this.getNewOrExistingListSettings(listKey, ['raw.SequenceNumber'],
          [
              new ListColumnSettingForBadge('healthState', 'Health State'),
              new ListColumnSetting('raw.SourceId', 'Source'),
              new ListColumnSetting('raw.Property', 'Property'),
              new ListColumnSettingWithUtcTime('sourceUtcTimestamp', 'Source UTC'),
              new ListColumnSetting('TTL', 'TTL'),
              new ListColumnSetting('raw.SequenceNumber', 'Sequence Number'),
              new ListColumnSetting('raw.RemoveWhenExpired', 'Remove When Expired'),
              new ListColumnSetting('raw.IsExpired', 'Is Expired')
          ],
          // Second row with description
          [
              new ListColumnSetting('placeholder', 'placeholder', {enableFilter: false}), // Empty column
              new ListColumnSettingWithCopyText('description', 'Description', {enableFilter: false, colspan: 7})
          ],
          false,
          (item) => item.description.length > 0
          );
  }

  public getNewOrExistingNodeStatusListSetting(listKey: string = 'node Status') {
      return this.getNewOrExistingListSettings(listKey, null,
          [
              new ListColumnSetting('nodeType', 'Node Type'),
              new ListColumnSetting('totalCount', 'Total Node Count'),
              new ListColumnSetting(`statusTypeCounts.${NodeStatusConstants.Up}`, NodeStatusConstants.Up),
              new ListColumnSetting(`statusTypeCounts.${NodeStatusConstants.Down}`, NodeStatusConstants.Down),
              new ListColumnSetting(`statusTypeCounts.${NodeStatusConstants.Disabled}`, NodeStatusConstants.Disabled),
              new ListColumnSetting(`statusTypeCounts.${NodeStatusConstants.Disabling}`, NodeStatusConstants.Disabling),
              new ListColumnSetting('errorCount', 'Error'),
              new ListColumnSetting('warningCount', 'Warning'),
          ]

      );
  }

  public getNewOrExistingBackupPolicyListSettings(listKey: string = 'backup Policies') {
      return this.getNewOrExistingListSettings(listKey, null, [
        new ListColumnSetting('raw.Name', 'Name', {
            enableFilter: false,
            cssClasses: "link",
            colspan: 1,
            clickEvent: item => item.action.run()
          }),
          new ListColumnSetting('raw.Schedule.ScheduleKind', 'ScheduleKind'),
          new ListColumnSetting('raw.Storage.StorageKind', 'StorageKind'),
          new ListColumnSetting('raw.AutoRestoreOnDataLoss', 'AutoRestoreOnDataLoss'),
          new ListColumnSetting('raw.MaxIncrementalBackups', 'MaxIncrementalBackups'),
      ]);
  }

  public getNewOrExistingNetworkRequestListSettings(includeApiDesc: boolean = false) {
    const listKey = 'requests Data';
    const settings = [
        new ListColumnSetting('statusCode', 'Status Code'),
        new ListColumnSetting('errorMessage', 'Error Message'),
        new ListColumnSetting('duration', 'Duration(MS)'),
        new ListColumnSettingWithUtcTime('startTime', 'Start Time'),
      ];

    if (includeApiDesc) {
        return this.getNewOrExistingListSettings(listKey + 'andApiDesc', [],
                                                [new ListColumnSetting('apiDesc', 'API Description')].concat(settings));
      }

    return this.getNewOrExistingListSettings(listKey, [], settings);

  }

  public getNewOrExistingPendingRepairTaskListSettings(listKey: string = 'pendingRepair'){
    return this.getNewOrExistingListSettings(listKey, ['raw.History.CreatedUtcTimestamp'],
    [
        new ListColumnSettingWithCustomComponent(QuestionToolTipComponent, 'raw.TaskId', 'Task Id'),
        new ListColumnSetting('raw.Action', 'Action', {enableFilter: true}),
        new ListColumnSettingWithShorten('raw.Target.NodeNames', 'Target', 2),
        new ListColumnSetting('impactedNodesWithImpact', 'Impact'),
        new ListColumnSetting('raw.State', 'State', {enableFilter: true}),
        new ListColumnSettingWithUtcTime('raw.History.CreatedUtcTimestamp', 'Created At'),
        new ListColumnSetting('displayDuration', 'Duration', {
            sortPropertyPaths: ['duration']
        }),
    ],
    [
        new ListColumnSettingWithCustomComponent(RepairTaskViewComponent,
        '',
        '',
        {
            enableFilter: false,
            colspan: -1
        })
    ],
    true,
    (item) => (Object.keys(item).length > 0),
    true);
  }

  public getNewOrExistingCompletedRepairTaskListSettings(listKey: string = 'completedRepair'){
    return this.getNewOrExistingListSettings(listKey, ['raw.History.CreatedUtcTimestamp'],
    [
        new ListColumnSettingWithCustomComponent(QuestionToolTipComponent, 'raw.TaskId', 'Task Id'),
        new ListColumnSetting('raw.Action', 'Action', {enableFilter: true}),
        new ListColumnSettingWithShorten('raw.Target.NodeNames', 'Target', 2),
        new ListColumnSetting('impactedNodesWithImpact', 'Impact'),
        new ListColumnSetting('raw.ResultStatus', 'Result Status', {enableFilter: true}),
        new ListColumnSettingWithUtcTime('raw.History.CreatedUtcTimestamp', 'Created At'),
        new ListColumnSetting('displayDuration', 'Duration', {
            sortPropertyPaths: ['duration']
        }),
    ],
    [
        new ListColumnSettingWithCustomComponent(RepairTaskViewComponent,
        '',
        '',
        {
            enableFilter: false,
            colspan: -1
        })
    ],
    true,
    (item) => true,
    true);
  }

  public getNewOrExistingAppTypeListSettings(includeIsUsedColumn: boolean = false, includeActions: boolean = true) {
    let listKey = 'appTypeAppTypes';
    const settings = [
      new ListColumnSettingWithFilter('name', 'Name'),
      new ListColumnSetting('raw.Version', 'Version'),
      new ListColumnSettingWithFilter('raw.Status', 'Status'),
    ];

    if(includeActions) {
      settings.push(new ListColumnSettingForApplicationType())
    }

    const nestedList = [
      new ListColumnSetting('placeholder', 'placeholder', { enableFilter: false }), // Empty column
      new ListColumnSetting('raw.StatusDetails', 'Status Details', {
        enableFilter: false,
        cssClasses: "preserve-whitespace-wrap",
        colspan: 100
      })
    ];

    if (includeIsUsedColumn) {
      settings.splice(3, 0, new ListColumnSetting('isInUse', 'In Use'));
      listKey += 'andUsedCol';
    }

    return this.getNewOrExistingListSettings(listKey, ['raw.Version'], settings, nestedList,
      false,
      (item) => item.raw.StatusDetails,
      false);
  }

  public getNewOrExistingInfrastructureSettings() {
    return this.getNewOrExistingListSettings('allMRJobs', ['raw.CurrentUD'], [
      new ListColumnSetting('raw.Id', 'Job Id'),
      new ListColumnSettingWithFilter('raw.CurrentUD', 'Current UD'),
      new ListColumnSetting('raw.AcknowledgementStatus', 'Acknowledgement Status'),
      new ListColumnSetting('raw.ImpactAction', 'Impact Action'),
      new ListColumnSetting('RepairTask.TaskId', 'Repair Task'),
      new ListColumnSettingWithShorten('raw.RoleInstancesToBeImpacted', 'Target Nodes', 2),
    ]);
  }

  // Update all existing list settings to use new limit
  private updatePaginationLimit(limit: number): void {
      Object.keys(this.listSettings).forEach(key => {
          const item = this.listSettings[key];
          item.currentPage = 1;
          item.limit = limit;
      });
  }

  public getSessionVariable<T>(key: string): T {
      return this.sessionVariables[key];
  }

  public setSessionVariable<T>(key: string, value: T) {
    this.sessionVariables[key] = value;
  }
}

