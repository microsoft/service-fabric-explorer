import { Component, Input, OnChanges, ViewChildren, QueryList, AfterViewInit, Type } from '@angular/core';
import { IOnDateChange } from '../../time-picker/double-slider/double-slider.component';
import { DataService } from 'src/app/services/data.service';
import { ListSettings } from 'src/app/Models/ListSettings';
import { IOptionConfig, IOptionData } from '../option-picker/option-picker.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { forkJoin } from 'rxjs';
import { VisualizationDirective } from '../visualization.directive';
import { IEventColumnUpdate, VisualizationComponent } from '../visualizationComponents';
import { RcaVisualizationComponent } from '../rca-visualization/rca-visualization.component';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IDataModel } from 'src/app/Models/DataModels/Base';
import { EventChip } from '../event-chip/event-chip.component';
import { EventService } from 'src/app/services/event.service';
import { SimpleChanges } from '@angular/core';

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

interface IVisReference {
  name: string,
  component: Type<VisualizationComponent>
}

@Component({
  selector: 'app-event-store',
  templateUrl: './event-store.component.html',
  styleUrls: ['./event-store.component.scss']
})
export class EventStoreComponent implements OnChanges, AfterViewInit {

  constructor(public dataService: DataService, public eventService: EventService) { }

  @ViewChildren(VisualizationDirective) vizDirs: QueryList<VisualizationDirective>;
  @Input() listEventStoreData: IEventStoreData<any, any>[] = [];
  @Input() optionsConfig: IOptionConfig;

  @Input() listEventChips: EventChip[] = [];

  public failedRefresh = false;
  public activeTab: number;

  public startDate: Date;
  public endDate: Date;
  public dateMin: Date;

  private visualizations: VisualizationComponent[] = [];
  public vizRefs: IVisReference[] =
    [
      { name: "Timeline", component: TimelineComponent },
      { name: "RCA Summary", component: RcaVisualizationComponent }
    ];

  private visualizationsReady = false;
  
  ngAfterViewInit() {
    this.dataService.clusterManifest.ensureInitialized().subscribe(() => {
      this.dateMin = TimeUtils.AddDays(new Date(), -this.dataService.clusterManifest.eventStoreTimeRange);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.listEventChips) {
      let len = changes.listEventChips.currentValue.length - (changes.listEventChips.previousValue?.length || 0);
      const newChips = changes.listEventChips.currentValue.slice(-1 * (len));
      newChips.forEach(c => this.addEvents(c));
    }

    this.update();
  }

  private setVisualizations(): void {

    if (this.vizDirs.length < this.visualizations.length) { //if some visualizations have been removed, clear the array
      this.visualizations.splice(this.vizDirs.length);  
    }
    this.vizDirs.forEach((dir, i) => {

      if (dir.name !== this.vizRefs[i].name) { //check and update each visualization directive template
        dir.name = this.vizRefs[i].name;
        dir.viewContainerRef.clear();

        const componentRef = dir.viewContainerRef.createComponent<VisualizationComponent>(this.vizRefs[i].component);
        const instance = componentRef.instance;
        
        if (instance.selectEvent) {
          instance.selectEvent.subscribe((id) => this.setSearch(id));
        }
  
        if (instance.updateColumn) {
          instance.updateColumn.subscribe((update) => this.updateColumn(update));
        }
  
        this.visualizations.splice(i, 1, instance);
        
      }
    })
  }

  /* date determines the data */
  public setDate(newDate: IOnDateChange) {
    this.endDate = newDate.endDate;
    this.startDate = newDate.startDate;
    this.visualizationsReady = true;
    this.setNewDateWindow(true);
  }
  
  //handle outputs from visualizations

  public setSearch(id: string) {
    this.listEventStoreData.forEach((list, i) => {
      if (list.objectResolver(id)) {
        this.activeTab = i
        setTimeout(() =>
          list.listSettings.search = id, 1)
      }
    })
  }

  private updateColumn(update: IEventColumnUpdate) {

    const listSettings = this.listEventStoreData.find(list => list.displayName === update.listName).listSettings; 
    let columnSettings = listSettings.columnSettings;;
    
    if (update.isSecondRow) {
      columnSettings = listSettings.secondRowColumnSettings;
    }

    const index = columnSettings.findIndex(setting => setting.id === update.columnSetting.id);

    if (index == -1) {
      update.index = update.index != undefined ? update.index : columnSettings.length;
    }
    else {
      update.index = index;  
    }

    columnSettings.splice(update.index, index == -1 ? 0 : 1, update.columnSetting);
      
  }

  /*check if update needed */
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

  //update loop for visualizations
  public update(): void {

    if (this.visualizationsReady) {
      this.setVisualizations();

      if (this.activeTab >= this.listEventStoreData.length) {
        this.activeTab = 0;
      }

      const timelineEventSubs = this.listEventStoreData.map(data => data.eventsList.refresh());
  
      if (timelineEventSubs.length) {
        forkJoin(timelineEventSubs).subscribe((refreshList) => {
          this.failedRefresh = refreshList.some(e => !e);
          this.visualizations.forEach(visualization => {
            visualization.update({listEventStoreData: this.listEventStoreData, startDate: this.startDate, endDate: this.endDate});
          })
        });
      }
      else {
        this.visualizations.forEach(visualization => {
          visualization.update({ listEventStoreData: this.listEventStoreData, startDate: this.startDate, endDate: this.endDate });
        });
      }
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

  addEvents(chip: EventChip) {

    const events = this.eventService.getEvents({ type: chip.type, eventsFilter: chip.eventsFilter, id: chip.id, partitionId: chip.partitionId, });

    const chipIndex = this.listEventChips.findIndex(c => c.name === chip.name); //find position by the old name
    chip.name = events.displayName; //then update name
    
    if (chipIndex == -1) {
      this.listEventChips.push(chip);
      this.listEventStoreData.push(events);  
    }
    else {
      this.listEventChips[chipIndex] = chip;
      this.listEventStoreData[chipIndex] = events;  
    }

    this.listEventChips = [...this.listEventChips];
    this.listEventStoreData = [...this.listEventStoreData];

    this.setNewDateWindow(true);
  }

  removeEvents(name: string) {
    this.listEventStoreData = this.listEventStoreData.filter(item => item.displayName !== name);
    this.listEventChips = this.listEventChips.filter(item => item.name !== name);
    this.setNewDateWindow(true);
  }
  
}
