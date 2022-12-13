import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { TelemetryEventNames } from 'src/app/Common/Constants';
import { ITimelineData, ITimelineItem, parseEventsGenerically, TimeLineGeneratorBase } from 'src/app/Models/eventstore/timelineGenerators';
import { ListSettings } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { DataSet } from 'vis-data';
import { DataGroup } from 'vis-timeline';
import { IOnDateChange } from '../../time-picker/double-slider/double-slider.component';
import { IOptionConfig, IOptionData } from '../option-picker/option-picker.component';

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
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit, OnChanges {

  @Input() listEventStoreData: IEventStoreData<any, any>[];
  @Input() optionsConfig: IOptionConfig;

  public get showAllEvents() { return this.pshowAllEvents; }
  public set showAllEvents(state: boolean) {
    this.pshowAllEvents = state;
    this.timeLineEventsData = this.getTimelineData();
  }

  public timeLineEventsData: ITimelineData;
  // public activeTab: string;
  public showCorrelatedBtn = false;
  public transformText = 'Category,Kind';


  private startDate: Date;
  private endDate: Date;
  private pshowAllEvents = false;


  constructor(public dataService: DataService, private telemService: TelemetryService) { }

  ngOnInit() {
    this.pshowAllEvents = this.checkAllOption();
    this.showCorrelatedBtn = !this.pshowAllEvents;
    this.setTimelineData();
    
  }

  ngOnChanges(): void {
    this.setTimelineData();
  }

  public checkAllOption(): boolean {
    return this.listEventStoreData.some(data => !data.timelineGenerator);
  }

  public setDate(newDate: IOnDateChange) {
    this.endDate = newDate.endDate;
    this.startDate = newDate.startDate;
    console.log(this.startDate, this.endDate)
    this.setTimelineData();
  }
  
  public setSearch(search?: string) {
    if (search) {
      const item = this.timeLineEventsData.items.get(search);
      const id = (item.id as string).split('---')[1];
      this.listEventStoreData.forEach((list, i) => {
        if (list.timelineResolver(id)) {
          // this.activeTab = list.displayName
          setTimeout(() =>
            list.listSettings.search = id, 1)
        }
      })
    }
  }
  public mergeTimelineData(combinedData: ITimelineData, data: ITimelineData): void {
    data.items.forEach(item => combinedData.items.add(item));

    data.groups.forEach(group => combinedData.groups.add(group));

    combinedData.potentiallyMissingEvents =
      combinedData.potentiallyMissingEvents || data.potentiallyMissingEvents;
  }

  public setTimelineData(): void {
    const timelineEventSubs = this.listEventStoreData.map(data => data.eventsList.refresh());
    forkJoin(timelineEventSubs).subscribe(() => {
      this.timeLineEventsData = this.getTimelineData();
      // this.getConcurrentEventsData();
    });
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
    // this.failedRefresh = false;
    const addNestedGroups = this.listEventStoreData.length > 1;

    // only emit metrics when more than 1 event type is added
    if (this.listEventStoreData.length > 1) {
      const names = this.listEventStoreData.map(item => item.displayName).sort();
      this.telemService.trackActionEvent(TelemetryEventNames.CombinedEventStore, { value: names.toString() }, names.toString());
    }
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

            this.mergeTimelineData(combinedTimelineData, data.timelineData);
          }
        } catch (e) {
          console.error(e);
        }
      }
      else {
        // this.failedRefresh = true;
      }
    }

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

  public processData(option: IOptionData) {
    if (option.addToList) {
      this.listEventStoreData.push(option.data);
    }
    else {
      this.listEventStoreData = this.listEventStoreData.filter(item => item.displayName !== option.data.displayName);
    }
    this.setNewDateWindow(true);
    // this.getConcurrentEventsData();
  }

}
