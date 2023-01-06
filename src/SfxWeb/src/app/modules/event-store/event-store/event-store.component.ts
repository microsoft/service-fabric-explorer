import { Component, Input, OnChanges, ViewChildren, QueryList, AfterViewInit, Type } from '@angular/core';
import { IOnDateChange } from '../../time-picker/double-slider/double-slider.component';
import { DataService } from 'src/app/services/data.service';
import { ListSettings } from 'src/app/Models/ListSettings';
import { IOptionConfig, IOptionData } from '../option-picker/option-picker.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { forkJoin } from 'rxjs';
import { VisualizationDirective } from '../visualization.directive';
import { EventColumnUpdate, VisualizationComponent } from '../visualizationComponents';
import { RcaVisualizationComponent } from '../rca-visualization/rca-visualization.component';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IDataModel } from 'src/app/Models/DataModels/Base';

export type EventType =
  "Cluster" |
  "Node" |
  'Application' |
  "Partition" |
  "RepairTask"

export interface IEventStoreData<IVisPresentEvent, S> {
  eventsList: IVisPresentEvent;
  type?: EventType;
  displayName: string;
  listSettings?: ListSettings;
  getEvents?(): S[];
  setDateWindow?(startDate: Date, endDate: Date): boolean;
  objectResolver?(id: string): IDataModel<any>; //used to determine if the data contains a given event;
}

@Component({
  selector: 'app-event-store',
  templateUrl: './event-store.component.html',
  styleUrls: ['./event-store.component.scss']
})
export class EventStoreComponent implements OnChanges, AfterViewInit {

  constructor(public dataService: DataService) { }

  @ViewChildren(VisualizationDirective) vizDirs: QueryList<VisualizationDirective>;
  @Input() listEventStoreData: IEventStoreData<any, any>[];
  @Input() optionsConfig: IOptionConfig;

  public failedRefresh = false;
  public activeTab: string;

  public startDate: Date;
  public endDate: Date;
  public dateMin: Date;

  private visualizations: VisualizationComponent[] = [];
  public vizRefs: Type<any>[] = [TimelineComponent, RcaVisualizationComponent];
  private visualizationsReady = false;
  
  ngAfterViewInit() {
    this.dataService.clusterManifest.ensureInitialized().subscribe(() => {
      this.dateMin = TimeUtils.AddDays(new Date(), -this.dataService.clusterManifest.eventStoreTimeRange);
    });
  }

  ngOnChanges(): void {
    this.update();
  }

  private setVisualizations(): void {

    this.vizDirs.forEach((dir, i) => {
      // if()
      const componentRef = dir.viewContainerRef.createComponent<VisualizationComponent>(this.vizRefs[i]);
      const instance = componentRef.instance;
      
      if (instance.selectEvent) {
        instance.selectEvent.subscribe((id) => this.setSearch(id));
      }

      if (instance.updateColumn) {
        instance.updateColumn.subscribe((update) => this.updateColumn(update));
      }

      this.visualizations.push(instance);
    })
  }

  /* date determines the data */
  public setDate(newDate: IOnDateChange) {
    this.endDate = newDate.endDate;
    this.startDate = newDate.startDate;
    this.visualizationsReady = true;
    this.setNewDateWindow(true);
  }
  
  /* initiated from timeline, but affect the list*/
  public setSearch(id: string) {
    this.listEventStoreData.forEach((list, i) => {
      if (list.objectResolver(id)) {
        this.activeTab = list.displayName
        setTimeout(() =>
          list.listSettings.search = id, 1)
      }
    })
  }

  private updateColumn(update: EventColumnUpdate) {

    for (const data of this.listEventStoreData) {
      let index: number;
      
      if (update.isSecondRow) {
        index = data.listSettings.secondRowColumnSettings.findIndex(setting => setting.id === update.columnSetting.id);
      }
      else {
        index = data.listSettings.columnSettings.findIndex(setting => setting.id === update.columnSetting.id);
      }

      if (index != -1) {
        if (update.isSecondRow) {
          data.listSettings.secondRowColumnSettings[index] = update.columnSetting;
        }
        else {
          data.listSettings.columnSettings[index] = update.columnSetting;
        }
      }
    }
      
  }

  /* work w/ processData to check if update needed */
  private setNewDateWindow(forceRefresh: boolean = false): void {
    // If the data interface has that function implemented, we call it. If it doesn't we discard it by returning false.
    let refreshData = false;

    this.listEventStoreData.forEach(data => {
      if (data.setDateWindow) {
        if (data.setDateWindow(this.startDate, this.endDate)) {
          refreshData = true;
        }
      }
    });

    if (refreshData || forceRefresh) {
      this.update();
    }
  }

  /* potential new starting point for calling updates on all visualizations*/
  public update(): void {

    if (this.visualizationsReady) {
      this.setVisualizations();
      const timelineEventSubs = this.listEventStoreData.map(data => data.eventsList.refresh());
  
      forkJoin(timelineEventSubs).subscribe((refreshList) => {
        this.failedRefresh = refreshList.some(e => !e);
        this.visualizations.forEach(visualization => {
          visualization.update({listEventStoreData: this.listEventStoreData, startDate: this.startDate, endDate: this.endDate});
        })
      });
    }
  }

  /* filter event types; then update everything */
  processData(option: IOptionData) {
    if (option.addToList) {
      this.listEventStoreData = [...this.listEventStoreData, option.data];
    }
    else {
      this.listEventStoreData = this.listEventStoreData.filter(item => item.displayName !== option.data.displayName);
    }
    this.setNewDateWindow(true);
  }

}
