import { Component, OnInit, Output, EventEmitter, Input, OnChanges } from '@angular/core';
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
    enableApplication?: boolean;
    enableRepairTasks?: boolean;
}

@Component({
  selector: 'app-option-picker',
  templateUrl: './option-picker.component.html',
  styleUrls: ['./option-picker.component.scss']
})
export class OptionPickerComponent implements OnChanges {
  @Input() optionsConfig: IOptionConfig;
  @Input() listEventStoreData: IEventStoreData<any, any>[];
  @Output() selectedOption = new EventEmitter<IOptionData>();
  checkedStates: Record<string, boolean> = {};
  options: IEventStoreData<any, any>[] = [];

  constructor(public dataService: DataService, public settings: SettingsService) {}

  ngOnChanges(): void {
    if (this.optionsConfig.enableCluster) {
      const cluster = this.dataService.getClusterEventData();
      if(!this.options.some(option => option.displayName === cluster.displayName)) {
        this.options.push(cluster);
      }
      this.checkedStates[cluster.displayName] = this.listEventStoreData.some(ESD => ESD.displayName === cluster.displayName);
    }

    if (this.optionsConfig.enableNodes) {
      const nodes = this.dataService.getNodeEventData();
      if(!this.options.some(option => option.displayName === nodes.displayName)) {
        this.options.push(nodes);
      }
      this.checkedStates[nodes.displayName] = this.listEventStoreData.some(ESD => ESD.displayName === nodes.displayName);
    }

    if (this.optionsConfig.enableApplication) {
      const application = this.dataService.getApplicationEventData();
      if(!this.options.some(option => option.displayName === application.displayName)) {
        this.options.push(application);
      }
      this.checkedStates[application.displayName] = this.listEventStoreData.some(ESD => ESD.displayName === application.displayName);
    }

    if (this.optionsConfig.enableRepairTasks) {
      this.dataService.clusterManifest.ensureInitialized().subscribe(() => {
        if (this.dataService.clusterManifest.isRepairManagerEnabled) {
          this.dataService.repairCollection.ensureInitialized().subscribe(() => {
            const repairTasks = this.dataService.getRepairTasksData(this.settings);
            if(!this.options.some(option => option.displayName === repairTasks.displayName)) {
              this.options.push(repairTasks);
            }
            this.checkedStates[repairTasks.displayName] = this.listEventStoreData.some(ESD => ESD.displayName === repairTasks.displayName);
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
