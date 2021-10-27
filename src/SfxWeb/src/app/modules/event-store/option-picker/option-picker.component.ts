import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IEventStoreData } from '../event-store/event-store.component';

export interface IOptionData {
  data: IEventStoreData<any, any>;
  addToList: boolean;
}

export interface IOptionConfig{
    enableCluster?: boolean;
    enableNodes?: boolean;
    enableRepairTasks?: boolean;
}

@Component({
  selector: 'app-option-picker',
  templateUrl: './option-picker.component.html',
  styleUrls: ['./option-picker.component.scss']
})
export class OptionPickerComponent implements OnInit {
  @Input() optionsConfig: IOptionConfig;
  @Output() selectedOption = new EventEmitter<IOptionData>();
  options: IEventStoreData<any, any>[] = [];

  constructor(public dataService: DataService, public settings: SettingsService) {}

  ngOnInit(): void {
    if (this.optionsConfig.enableCluster) {
      this.options.push(this.dataService.getClusterEventData());
    }

    if (this.optionsConfig.enableNodes) {
      this.options.push(this.dataService.getNodeEventData());
    }

    if (this.optionsConfig.enableRepairTasks) {
      this.dataService.clusterManifest.ensureInitialized().subscribe(() => {
        if (this.dataService.clusterManifest.isRepairManagerEnabled) {
          this.dataService.repairCollection.ensureInitialized().subscribe(() => {
            this.options.push(this.dataService.getRepairTasksData(this.settings));
          });
        }
      });
    }
  }

  emitData(data: IEventStoreData<any, any>, option: any) {
    this.selectedOption.emit({
      data,
      addToList: option.target.checked
    });
  }

}
