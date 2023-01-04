import { Component, Input, OnInit, OnChanges, ViewChildren, QueryList, AfterViewInit, Type } from '@angular/core';
import { IOnDateChange } from '../../time-picker/double-slider/double-slider.component';
import { DataService } from 'src/app/services/data.service';
import { ListSettings } from 'src/app/Models/ListSettings';
import { IOptionConfig, IOptionData } from '../option-picker/option-picker.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { forkJoin } from 'rxjs';
import { VisualizationDirective } from '../visualization.directive';
import { VisualizationComponent } from '../visualizationComponents';
import { RcaVisualizationComponent } from '../rca-visualization/rca-visualization.component';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IDataModel } from 'src/app/Models/DataModels/Base';

export enum EventType {
  Cluster,
  Node,
  Application,
  Partition,
  RepairTask
}
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
export class EventStoreComponent implements OnInit, OnChanges, AfterViewInit {

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
  private vizRefs: Type<any>[] = [TimelineComponent, RcaVisualizationComponent];
  

  ngOnInit() {
    this.dataService.clusterManifest.ensureInitialized().subscribe(() => {
      this.dateMin = TimeUtils.AddDays(new Date(), -this.dataService.clusterManifest.eventStoreTimeRange);
    });
  }

  ngAfterViewInit() {
    this.setVisualizations();
  }

  ngOnChanges(): void {
    this.update();
  }

  private setVisualizations(): void {
    this.vizDirs.forEach((dir, i) => {
      const componentRef = dir.viewContainerRef.createComponent<VisualizationComponent>(this.vizRefs[i]);
      const instance = componentRef.instance;
      
      instance.listEventStoreData = this.listEventStoreData;
      
      if (instance.startDate) {
        instance.startDate = this.startDate;
      }

      if (instance.endDate) {
        instance.endDate = this.endDate;
      }
      
      if (instance.selectEvent) {
        instance.selectEvent.subscribe((id) => this.setSearch(id));
      }

      this.visualizations.push(instance);
    })

    this.update();
  }

  /* date determines the data */
  public setDate(newDate: IOnDateChange) {
    this.endDate = newDate.endDate;
    this.startDate = newDate.startDate;
    this.setNewDateWindow(true);
  }
  
  /* initiated from timeline, but affect the list*/
  public setSearch(id: string) {
    console.log(id);
    this.listEventStoreData.forEach((list, i) => {
      if (list.objectResolver(id)) {
        this.activeTab = list.displayName
        setTimeout(() =>
          list.listSettings.search = id, 1)
      }
    })
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
    const timelineEventSubs = this.listEventStoreData.map(data => data.eventsList.refresh());

    forkJoin(timelineEventSubs).subscribe((refreshList) => {
      this.failedRefresh = refreshList.some(e => !e);
      this.visualizations.forEach(e => e.update())
    });
  }

  /* filter event types; then update everything */
  processData(option: IOptionData) {
    if (option.addToList) {
      this.listEventStoreData.push(option.data);
    }
    else {
      this.listEventStoreData = this.listEventStoreData.filter(item => item.displayName !== option.data.displayName);
    }
    this.setNewDateWindow(true);
  }

}
