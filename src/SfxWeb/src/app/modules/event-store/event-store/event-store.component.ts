import { Component, OnInit, Input, OnDestroy, OnChanges } from '@angular/core';
import { ITimelineData, TimeLineGeneratorBase, parseEventsGenerically, ITimelineItem } from 'src/app/Models/eventstore/timelineGenerators';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IOnDateChange } from '../double-slider/double-slider.component';
import { Subject, Subscription, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DataService } from 'src/app/services/data.service';
import { DataGroup, DataItem, DataSet, Timeline } from 'vis-timeline/standalone/esm';
import { ListColumnSetting, ListColumnSettingWithEmbeddedVisTool, ListSettings } from 'src/app/Models/ListSettings';
import { IOptionConfig, IOptionData } from '../option-picker/option-picker.component';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { TelemetryEventNames } from 'src/app/Common/Constants';
import { RelatedEventsConfigs } from '../../../Models/eventstore/RelatedEventsConfigs';
import { Utils } from 'src/app/Utils/Utils';
import { ListColumnSettingWithCustomComponent } from 'src/app/Models/ListSettings';
import { VisualizationToolComponent } from '../../concurrent-events-visualization/visualization-tool/visualization-tool.component';
import { VisualizationLogoComponent } from '../../concurrent-events-visualization/visualization-logo/visualization-logo.component';
import { getSimultaneousEventsForEvent, IConcurrentEvents, IRCAItem } from 'src/app/Models/eventstore/rcaEngine';
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



export interface IQuickDates {
  display: string;
  hours: number;
}


export interface IEventStoreData<IVisPresentEvent, S> {
  eventsList: IVisPresentEvent;
  timelineGenerator?: TimeLineGeneratorBase<S>;
  timelineData?: ITimelineData;
  displayName: string;
  listSettings?: ListSettings;
  getEvents?(): S[];
  setDateWindow?(startDate: Date, endDate: Date): boolean;
  timelineResolver?(id: string): boolean; //used to determine if the data contains a given event;
}

@Component({
  selector: 'app-event-store',
  templateUrl: './event-store.component.html',
  styleUrls: ['./event-store.component.scss']
})
export class EventStoreComponent implements OnInit, OnDestroy, OnChanges {

  constructor(public dataService: DataService, private telemService: TelemetryService) { }

  queryString = "";
  db: Database;
  result = {};
  resultTableSettings: ListSettings;

  public get showAllEvents() { return this.pshowAllEvents; }
  public set showAllEvents(state: boolean) {
    this.pshowAllEvents = state;
    this.timeLineEventsData = this.getTimelineData();
  }

  private debounceHandler: Subject<IOnDateChange> = new Subject<IOnDateChange>();
  private debouncerHandlerSubscription: Subscription;

  public quickDates = [
    { display: 'Last 1 Hour', hours: 1 },
    { display: 'Last 3 Hours', hours: 3 },
    { display: 'Last 6 Hours', hours: 6 },
    { display: 'Last 1 Day', hours: 24 },
    { display: 'Last 7 Days', hours: 168 }
  ];

  @Input() listEventStoreData: IEventStoreData<any, any>[];
  @Input() optionsConfig: IOptionConfig;
  public startDateMin: Date;
  public startDateMax: Date;
  public failedRefresh = false;
  public timeLineEventsData: ITimelineData;

  public transformText = 'Category,Kind';

  private pshowAllEvents = false;
  public showCorrelatedBtn = false;

  public startDate: Date;
  public endDate: Date;

  public simulEvents: IConcurrentEvents[] = [];
  public activeTab: string;

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

  ngOnInit() {
    this.pshowAllEvents = this.checkAllOption();
    this.showCorrelatedBtn = !this.pshowAllEvents;
    this.resetSelectionProperties();
    this.setTimelineData();
    this.debouncerHandlerSubscription = this.debounceHandler
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(dates => {
        this.startDate = new Date(dates.startDate);
        this.endDate = new Date(dates.endDate);
        this.setNewDateWindow();
      });
  }

  ngOnChanges(): void {
    this.setTimelineData();
  }

  ngOnDestroy() {
    this.debouncerHandlerSubscription.unsubscribe();
  }

  public setSearch(search?: string) {
    if (search) {
      const item = this.timeLineEventsData.items.get(search);
      const id = (item.id as string).split('---')[1];
      this.listEventStoreData.forEach((list, i) => {
        if (list.timelineResolver(id)) {
          this.activeTab = list.displayName
          setTimeout(() =>
            list.listSettings.search = id, 1)
        }
      })
    }
  }

  public checkAllOption(): boolean {
    return this.listEventStoreData.some(data => !data.timelineGenerator);
  }

  private resetSelectionProperties(): void {
    const todaysDate = new Date();
    this.startDate = TimeUtils.AddDays(todaysDate, -7);
    this.endDate = this.startDateMax = todaysDate;
    this.startDateMin = TimeUtils.AddDays(todaysDate, -30);
  }

  public setDate(date: IQuickDates) {
    this.setNewDates({
      endDate: new Date(this.endDate),
      startDate: TimeUtils.AddHours(this.endDate, -1 * date.hours)
    });
  }

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
      this.setTimelineData();
    }
  }

  public mergeTimelineData(combinedData: ITimelineData, data: ITimelineData): void {
    data.items.forEach(item => combinedData.items.add(item));

    data.groups.forEach(group => combinedData.groups.add(group));

    combinedData.potentiallyMissingEvents =
      combinedData.potentiallyMissingEvents || data.potentiallyMissingEvents;
  }

  private initializeTimelineData(): ITimelineData {
    return {
      start: this.startDate,
      end: this.endDate,
      groups: new DataSet<DataGroup>(),
      items: new DataSet<ITimelineItem>()
    };
  }

  private getTimelineData(): ITimelineData {
    let rawEventlist = [];
    let combinedTimelineData = this.initializeTimelineData();
    this.failedRefresh = false;
    const addNestedGroups = this.listEventStoreData.length > 1;

    // only emit metrics when more than 1 event type is added
    if (this.listEventStoreData.length > 1) {
      const names = this.listEventStoreData.map(item => item.displayName).sort();
      this.telemService.trackActionEvent(TelemetryEventNames.CombinedEventStore, { value: names.toString() }, names.toString());
    }

    // const initSqlJs = require('sql.js');
    initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`

    }).then(SQL => {
      // Create a database
      const db = new SQL.Database();
      this.db = db;
      // NOTE: You can also use new SQL.Database(data) where
      // data is an Uint8Array representing an SQLite database file


      for (const data of this.listEventStoreData) {
        if (data.eventsList.lastRefreshWasSuccessful) {
          try {
            if (this.pshowAllEvents) {
              if (data.setDateWindow) {
                rawEventlist = rawEventlist.concat(data.getEvents());
              }

            } else if (data.timelineGenerator) {
              // If we have more than one element in the timeline the events get grouped by the displayName of the element.
              data.timelineData = data.timelineGenerator.generateTimeLineData(data.getEvents(), this.startDate, this.endDate, addNestedGroups ? data.displayName : null);

            }

            console.log(data.getEvents())
            const properties = getPropertiesFromList(data.getEvents().map(item => item.raw));
            console.log(properties);

            // Execute a single SQL string that contains multiple statements
            if(properties.allProperties.length > 0 ){
              const createTableLine = `CREATE TABLE ${data.displayName} (${properties.allProperties.map((key, index) => key.key + " " + key.type)})`;

              const prefix = `INSERT INTO ${data.displayName} VALUES `;
              let rows = "";
              properties.flattenedObjects.forEach(obj => {
                const propertiesList = [];

                properties.allProperties.forEach(prop => {
                  if (prop.key in obj) {
                    if (prop.type === "MEDIUMTEXT") {
                      propertiesList.push(`"${obj[prop.key]}"`)

                    } else {
                      propertiesList.push(obj[prop.key])
                    }
                  } else {
                    propertiesList.push('null')
                  }
                })

                rows += `${prefix} (${propertiesList}); \n`
              })

              let sqlstr = `
                          ${createTableLine};
                          ${rows}`;
              // CREATE TABLE hello (a int, b char);
              // console.log(sqlstr)
              const r = db.run(sqlstr); // Run the query without returning anything

              // Prepare an sql statement
              // const stmt = db.exec(`select * from Nodes where NodeInstanceId = 133143180153373540`);
              // console.log(db.exec(`select * from Nodes where NodeInstanceId = 133143180153373540`))
              // console.log(db.exec(`select * from ${data.displayName}`))
            }
          } catch (e) {
            console.error(e);
          }
        }
        else {
          this.failedRefresh = true;
        }

        this.mergeTimelineData(combinedTimelineData, data.timelineData);

      }

    })

    if (this.pshowAllEvents) {
      const d = parseEventsGenerically(rawEventlist, this.transformText);

      combinedTimelineData = {
        start: this.startDate,
        end: this.endDate,
        items: d.items,
        groups: d.groups
      };
    }

    return combinedTimelineData;
  }


  private getConcurrentEventsData() {
    let allEvents: IRCAItem[] = [];
    let sourceEvents = [];
    for (const data of this.listEventStoreData) {
      if (data.eventsList.lastRefreshWasSuccessful) {
        sourceEvents = sourceEvents.concat(data.getEvents());
        allEvents = allEvents.concat(data.eventsList.collection);
      }
    }

    // refresh vis-event-list
    this.simulEvents = getSimultaneousEventsForEvent(RelatedEventsConfigs, sourceEvents, sourceEvents);
    // grab highcharts data for all events
    for (let parsedEvent of allEvents) {
      let rootEvent = this.simulEvents.find(event => event.eventInstanceId === parsedEvent.eventInstanceId);
      let visPresent = false;
      if (rootEvent.reason) {
        visPresent = true;
      }

      (parsedEvent as any).visPresent = visPresent;

    }

    for (const data of this.listEventStoreData) {
      //add presentation column if not already there
      if (!data.listSettings.columnSettings.some(setting => setting.propertyPath == "visPresent")) {
        let newLogoSetting = new ListColumnSettingWithCustomComponent(
          VisualizationLogoComponent,
          'visPresent',
          'Visualization',
          {
            enableFilter: true,
            colspan: 1
          });
        newLogoSetting.fixedWidthPx = 100;
        data.listSettings.columnSettings.splice(1, 0, newLogoSetting);
        data.listSettings.secondRowColumnSettings.push(new ListColumnSettingWithEmbeddedVisTool(
          VisualizationToolComponent,
          '',
          '',
          this,
          {
            enableFilter: false,
            colspan: 3
          }
        ));
      }
    }
  }

  public setTimelineData(): void {
    const timelineEventSubs = this.listEventStoreData.map(data => data.eventsList.refresh());
    forkJoin(timelineEventSubs).subscribe(() => {
      this.timeLineEventsData = this.getTimelineData();
      this.getConcurrentEventsData();
    });
  }

  processData(option: IOptionData) {
    if (option.addToList) {
      this.listEventStoreData.push(option.data);
    }
    else {
      this.listEventStoreData = this.listEventStoreData.filter(item => item.displayName !== option.data.displayName);
    }
    this.setNewDateWindow(true);
    this.getConcurrentEventsData();
  }

  setNewDates(dates: IOnDateChange) {
    this.debounceHandler.next(dates);
  }
}
