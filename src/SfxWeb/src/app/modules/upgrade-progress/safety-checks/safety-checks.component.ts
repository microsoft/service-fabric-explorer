import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { IRawSafetyCheckDescription } from 'src/app/Models/RawDataTypes';
import { SettingsService } from 'src/app/services/settings.service';
import { ListColumnSetting, ListColumnSettingForLink, ListColumnSettingWithCustomComponent, ListSettings } from 'src/app/Models/ListSettings';
import { PartitionCacheService } from '../partition-cache.service';
import { LoadCellComponent } from '../load-cell/load-cell.component';

@Component({
  selector: 'app-safety-checks',
  templateUrl: './safety-checks.component.html',
  styleUrls: ['./safety-checks.component.scss']
})
export class SafetyChecksComponent implements OnChanges, OnInit {

  @Input() safetyChecks: IRawSafetyCheckDescription[];

  settings: ListSettings;
  safetyChecksWithData: IRawSafetyCheckDescription[] = [];
  tooManySafetyChecks = false;

  constructor(public partitionCache: PartitionCacheService,
              private cdr: ChangeDetectorRef,
              public settingsService: SettingsService) { }

  ngOnInit() {
    this.settings = this.settingsService.getNewOrExistingListSettings('safety-checks', null,
      [
        new ListColumnSettingWithCustomComponent(LoadCellComponent),
        new ListColumnSetting('SafetyCheck.Kind', 'Kind'),
        new ListColumnSettingForLink('SafetyCheck.PartitionId', 'Partition', (item) => item.link),
        new ListColumnSettingForLink('applicationName', 'Application', (item) => item.applicationLink),
        new ListColumnSettingForLink('serviceName', 'service', (item) => item.serviceLink),
      ]);

    this.partitionCache.partitionDataChanges.subscribe(id => {
      this.setSafetyChecks();
      this.cdr.detectChanges();
    });
  }

  ngOnChanges(): void {
    this.tooManySafetyChecks = this.safetyChecks.length > 5;

    this.safetyChecks.forEach(check => {
      if (check.SafetyCheck.PartitionId) {
        this.partitionCache.ensureInitialCache(check);

        if (!this.tooManySafetyChecks && this.partitionCache.partitions[check.SafetyCheck.PartitionId].loading === 'unstarted') {
          this.getPartitionInfo(check.SafetyCheck.PartitionId, check);
        }
      }
    });

    this.setSafetyChecks();
  }

  async getPartitionInfo(id: string, check: IRawSafetyCheckDescription) {

    await this.partitionCache.getPartitionInfo(id, check);

    this.setSafetyChecks();
    this.cdr.detectChanges();
  }

  safetyCheck(index, safetyCheck: IRawSafetyCheckDescription) {
    return safetyCheck.SafetyCheck.PartitionId || safetyCheck.SafetyCheck.Kind;
  }

  setSafetyChecks() {
    this.safetyChecksWithData = this.safetyChecks.map(check => {
      if (check.SafetyCheck.PartitionId) {
        return this.partitionCache.partitions[check.SafetyCheck.PartitionId];
      } else {
        return check;
      }
    });
  }

}

export interface IPartitionData extends IRawSafetyCheckDescription {
  serviceName?: string;
  applicationName?: string;
  partition?: string;
  loading: string;
  link?: string;
  applicationLink?: string;
  serviceLink?: string;
}
