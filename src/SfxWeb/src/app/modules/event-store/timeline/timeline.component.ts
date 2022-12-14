import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { TelemetryEventNames } from 'src/app/Common/Constants';
import { ITimelineData, ITimelineItem, parseEventsGenerically} from 'src/app/Models/eventstore/timelineGenerators';
import { DataService } from 'src/app/services/data.service';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { DataSet } from 'vis-data';
import { DataGroup } from 'vis-timeline';
import { IEventStoreData } from '../event-store/event-store.component';
import { Visualization } from '../visualization';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent extends Visualization implements OnInit, OnChanges {

  @Input() listEventStoreData: IEventStoreData<any, any>[];
  @Input() startDate: Date;
  @Input() endDate: Date;
  @Output() selectEvent = new EventEmitter<string>();


  public get showAllEvents() { return this.pshowAllEvents; }
  public set showAllEvents(state: boolean) {
    this.pshowAllEvents = state;
    this.timeLineEventsData = this.getTimelineData();
  }

  public timeLineEventsData: ITimelineData;
  public showCorrelatedBtn = false;
  public transformText = 'Category,Kind';

  private pshowAllEvents = false;


  constructor(public dataService: DataService, private telemService: TelemetryService) {
    super();
  }

  ngOnInit() {
    this.pshowAllEvents = this.checkAllOption();
    this.showCorrelatedBtn = !this.pshowAllEvents;
  }

  ngOnChanges(): void {
  }

  public checkAllOption(): boolean {
    return this.listEventStoreData.some(data => !data.timelineGenerator);
  }

  public setSearch(search?: string) {
    if (search) {
      const item = this.timeLineEventsData.items.get(search);
      const id = (item.id as string).split('---')[1];
      this.selectEvent.emit(id);
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

  public update() {
    console.log('hi')
    this.timeLineEventsData = this.getTimelineData();
  }
}