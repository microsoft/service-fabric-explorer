import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TelemetryEventNames } from 'src/app/Common/Constants';
import { ITimelineData, ITimelineItem, parseEventsGenerically } from 'src/app/Models/eventstore/timelineGenerators';
import { DataService } from 'src/app/services/data.service';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { TimelineGeneratorFactoryService } from 'src/app/services/timeline-generator-factory.service';
import { DataSet, DataGroup } from 'vis-timeline/standalone/esm';
import { IEventStoreData } from '../event-store/event-store.component';
import { VisualizationComponent } from '../visualizationComponents';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent implements OnInit, VisualizationComponent {

  @Input() listEventStoreData: IEventStoreData<any, any>[];
  @Input() startDate: Date = new Date();
  @Input() endDate: Date = new Date();
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


  constructor(
    public dataService: DataService,
    private telemService: TelemetryService,
    public changeDetector: ChangeDetectorRef,
    private timelineGeneratorFactoryService: TimelineGeneratorFactoryService) { }

  ngOnInit() {
    this.pshowAllEvents = this.checkAllOption();
    this.showCorrelatedBtn = !this.pshowAllEvents;
  }


  public checkAllOption(): boolean {
    return this.listEventStoreData.some(data => !data.type);
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

          } else if (data.type) {
            // If we have more than one element in the timeline the events get grouped by the displayName of the element.
            const timelineGenerator = this.timelineGeneratorFactoryService.getTimelineGenerator(data.type);
            const timelineData = timelineGenerator.generateTimeLineData(data.getEvents(), this.startDate, this.endDate, addNestedGroups ? data.displayName : null);

            this.mergeTimelineData(combinedTimelineData, timelineData);
          }
        } catch (e) {
          console.error(e);
        }
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
    this.timeLineEventsData = this.getTimelineData();
    this.changeDetector.markForCheck();
  }
}
