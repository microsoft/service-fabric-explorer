import { Component, Input, OnChanges, ViewChildren, QueryList, AfterViewInit, Type } from '@angular/core';
import { IOnDateChange } from '../../time-picker/double-slider/double-slider.component';
import { DataService } from 'src/app/services/data.service';
import { ListColumnSetting, ListSettings } from 'src/app/Models/ListSettings';
import { IOptionConfig, IOptionData } from '../option-picker/option-picker.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { forkJoin } from 'rxjs';
import { VisualizationDirective } from '../visualization.directive';
import { EventColumnUpdate, VisualizationComponent } from '../visualizationComponents';
import { RcaVisualizationComponent } from '../rca-visualization/rca-visualization.component';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IDataModel } from 'src/app/Models/DataModels/Base';
import initSqlJs, { Database } from 'sql.js';

const isoChecker = new RegExp(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/);

const getPropertyList = (object, prefix = "") => {

  let columns = [];
  let flattenedObject = {};
  Object.keys(object).forEach(key => {
    const value = object[key];
    const properKey = prefix + key;
    const type = typeof value;

    let isObj = false;

    if (type === "string") {
      if (isoChecker.test(value)) {
        // columns.push({
        //     key: properKey,
        //     type: 'date'
        // })
      } else {
        columns.push({
          key: properKey,
          type: 'MEDIUMTEXT'
        })
      }
    } else if (type === "number") {
      columns.push({
        key: properKey,
        type: object[properKey] % 1 === 0 ? 'INTEGER' : 'FLOAT'
      })
    } else if (type === "boolean") {
      columns.push({
        key: properKey,
        type: 'BOOLEAN'
      })
    } else if (type === "object" && !Array.isArray(value)) {
      const result = getPropertyList(value, key + "_");
      columns = columns.concat(result.columns);
      flattenedObject = { ...flattenedObject, ...result.properties }
      isObj = true;
    }

    if (!isObj) {
      flattenedObject[properKey] = value;
    }
  })

  return { columns, properties: flattenedObject };
}

const getPropertiesFromList = (objects) => {
  const allProperties = [];
  const seenProperties = new Set();

  const flattenedObjects = [];
  objects.forEach(obj => {
    const objProperties = getPropertyList(obj);
    flattenedObjects.push(objProperties.properties);
    objProperties.columns.forEach(obj => {
      if (!seenProperties.has(obj.key)) {
        allProperties.push(obj);
        seenProperties.add(obj.key)
      }
    })
  })

  return { allProperties, flattenedObjects };
}


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

interface VisReference {
  name: string,
  component: Type<any>
}

@Component({
  selector: 'app-event-store',
  templateUrl: './event-store.component.html',
  styleUrls: ['./event-store.component.scss']
})
export class EventStoreComponent implements OnChanges, AfterViewInit {

  queryString = "";
  db: Database;
  result = {};
  resultTableSettings: ListSettings;
  query() {
    try {
     this.result = this.db.exec(this.queryString);
      console.log(this.result);
     this.resultTableSettings = new ListSettings(100, [], 'results', []);
     const columns = this.result[0].columns;
     columns.forEach(column => {
      this.resultTableSettings.columnSettings.push(new ListColumnSetting(column, column));
     })

     this.result['objs'] = this.result[0].values.map(items => {
      const r = {};
      columns.forEach((column, i) => {
        r[column] = items[i];
      })

      return r;
     })

    } catch(e) {
      this.resultTableSettings = null;
      this.result = {
        error: e.toString()
      }
    }
  }

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
  public vizRefs: VisReference[] =
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

  ngOnChanges(): void {
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
        this.activeTab = list.displayName
        setTimeout(() =>
          list.listSettings.search = id, 1)
      }
    })
  }

  private updateColumn(update: EventColumnUpdate) {

    console.log(update);
    const list = this.listEventStoreData.find(list => list.displayName === update.listName); 
      
    if (update.isExisting) {

      if (update.isSecondRow) {
        update.index = list.listSettings.secondRowColumnSettings.findIndex(setting => setting.id === update.columnSetting.id);
      }
      else {
        update.index = list.listSettings.columnSettings.findIndex(setting => setting.id === update.columnSetting.id);
      }
    }
    else if (update.index == undefined) {
      update.index = update.isSecondRow ? list.listSettings.secondRowColumnSettings.length : list.listSettings.columnSettings.length;
    }

    if (update.isSecondRow) {
      list.listSettings.secondRowColumnSettings.splice(update.index, update.isExisting ? 1: 0, update.columnSetting);
    }
    else {
      list.listSettings.columnSettings.splice(update.index, update.isExisting ? 1 : 0, update.columnSetting);
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

  //update loop for visualizations
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
