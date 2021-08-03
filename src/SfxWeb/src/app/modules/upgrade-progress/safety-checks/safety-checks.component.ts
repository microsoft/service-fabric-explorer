import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { IRawSafetyCheckDescription } from 'src/app/Models/RawDataTypes';
import { RestClientService } from 'src/app/services/rest-client.service';
import { MessageService, MessageSeverity } from 'src/app/services/message.service';
import { SettingsService } from 'src/app/services/settings.service';
import { ListColumnSetting, ListColumnSettingForLink, ListColumnSettingWithCustomComponent, ListSettings } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { RoutesService } from 'src/app/services/routes.service';

@Component({
  selector: 'app-safety-checks',
  templateUrl: './safety-checks.component.html',
  styleUrls: ['./safety-checks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SafetyChecksComponent implements OnChanges, OnInit {

  @Input() safetyChecks: IRawSafetyCheckDescription[];
  // This can be provided to share a cache between safety check components
  @Input() partitions: Record<string, IPartitionData> = {};

  settings: ListSettings;

  safetyChecksWithData: IRawSafetyCheckDescription[] = [];

  tooManySafetyChecks = false;

  constructor(private restClientService: RestClientService,
              private cdr: ChangeDetectorRef,
              private messageService: MessageService,
              public settingsService: SettingsService,
              private dataService: DataService) { }

  ngOnInit() {
    this.settings = this.settingsService.getNewOrExistingListSettings('safety-checks', null,
      [
        new ListColumnSetting('SafetyCheck.Kind', 'Kind'),
        new ListColumnSettingForLink('SafetyCheck.PartitionId', 'Partition', (item) => item.link),
        new ListColumnSettingForLink('applicationName', 'Application', (item) => item.applicationLink),
        new ListColumnSettingForLink('serviceName', 'service', (item) => item.serviceLink),
    ]);
  }

  ngOnChanges(): void {
    console.log(this);

    this.tooManySafetyChecks = this.safetyChecks.length > 5;

    if (!this.tooManySafetyChecks) {
      this.safetyChecks.forEach(check => {
        if (check.SafetyCheck.PartitionId && !this.partitions[check.SafetyCheck.PartitionId]) {
          this.partitions[check.SafetyCheck.PartitionId] = {
            serviceName: null,
            applicationName: null,
            partition: null,
            loading: 'inflight',
            ...check
          };
          this.getPartitionInfo(check.SafetyCheck.PartitionId, check);
        }
      });
    }

    this.setSafetyChecks();
  }

  async getPartitionInfo(id: string, check: IRawSafetyCheckDescription) {
    try {
      const partition = await this.restClientService.getPartitionById(id).toPromise();
      const serviceName = await this.restClientService.getServiceNameInfo(id).toPromise();
      const applicationName = await this.restClientService.getApplicationNameInfo(serviceName.Id).toPromise();

      let app;
      if (applicationName.Id === 'fabric:/System') {
        app = await this.dataService.getSystemApp().toPromise();
      }else {
        app = await this.dataService.getApp(applicationName.Id).toPromise();
      }

      const route =  RoutesService.getPartitionViewPath(app.raw.TypeName, applicationName.Id,
        serviceName.Id, partition.PartitionInformation.Id);

      this.partitions[id] = {
        serviceName: serviceName.Id,
        applicationName: applicationName.Id,
        partition: partition.PartitionInformation.Id,
        loading: 'loaded',
        link: route,
        applicationLink: RoutesService.getAppViewPath(app.raw.TypeName, applicationName.Id),
        serviceLink: RoutesService.getServiceViewPath(app.raw.TypeName, applicationName.Id, serviceName.Id),
        ...check
      };

      console.log(serviceName);
    } catch {
      this.messageService.showMessage('There was an issue getting partition info', MessageSeverity.Err);
      this.partitions[id] = {
        serviceName: null,
        applicationName: null,
        partition: null,
        loading: 'failed',
        ...check
      };
    }

    this.setSafetyChecks();
    this.cdr.detectChanges();
  }

  safetyCheck(index, safetyCheck: IRawSafetyCheckDescription) {
    return safetyCheck.SafetyCheck.PartitionId || safetyCheck.SafetyCheck.Kind;
  }

  setSafetyChecks() {
    this.safetyChecksWithData = this.safetyChecks.map(check => {
      if (check.SafetyCheck.PartitionId) {
        return this.partitions[check.SafetyCheck.PartitionId];
      }else{
        return check;
      }
    });
    console.log(this.safetyChecksWithData);
  }

}

export interface IPartitionData extends IRawSafetyCheckDescription {
  serviceName: string;
  applicationName: string;
  partition: string;
  loading: string;
  link?: string;
  applicationLink?: string;
  serviceLink?: string;
}
