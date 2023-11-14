import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TelemetryEventNames } from 'src/app/Common/Constants';
import { mergeTimelineData } from 'src/app/Models/eventstore/periodicEventParser';
import { ITimelineData, ITimelineItem, parseEventsGenerically } from 'src/app/Models/eventstore/timelineGenerators';
import { DataService } from 'src/app/services/data.service';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { TimelineGeneratorFactoryService } from 'src/app/services/timeline-generator-factory.service';
import { DataSet, DataGroup } from 'vis-timeline/standalone/esm';
import { IEventStoreData } from '../event-store/event-store.component';
import { VisualizationComponent, VisUpdateData } from '../visualizationComponents';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent implements VisualizationComponent {

  @Input() listEventStoreData: IEventStoreData<any, any>[];
  @Input() startDate: Date = new Date();
  @Input() endDate: Date = new Date();
  @Output() selectEvent = new EventEmitter<string>();


  public get showCorrelatedEvents() { return this.pshowCorrelatedEvents; }
  public set showCorrelatedEvents(state: boolean) {
    this.pshowCorrelatedEvents = state;
    this.getTimelineData();
  }

  public timeLineEventsData: ITimelineData;
  public showCorrelatedBtn = false;
  public transformText = 'Category,Kind';

  private pshowCorrelatedEvents = true;


  constructor(
    public dataService: DataService,
    private telemService: TelemetryService,
    public changeDetector: ChangeDetectorRef,
    private timelineGeneratorFactoryService: TimelineGeneratorFactoryService) { }

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

  private initializeTimelineData(): ITimelineData {
    return {
      start: this.startDate,
      end: this.endDate,
      groups: new DataSet<DataGroup>(),
      items: new DataSet<ITimelineItem>()
    };
  }

  public getTimelineData() {
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
          if (!this.pshowCorrelatedEvents) {
            if (data.setDateWindow) {
              rawEventlist = rawEventlist.concat(data.getEvents());
            }

          } else if (data.type) {
            // If we have more than one element in the timeline the events get grouped by the displayName of the element.
            const timelineGenerator = this.timelineGeneratorFactoryService.getTimelineGenerator(data.type);
            const timelineData = timelineGenerator.generateTimeLineData(data.getEvents(), this.startDate, this.endDate, addNestedGroups ? data.displayName : null);

            mergeTimelineData(combinedTimelineData, timelineData);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (!this.pshowCorrelatedEvents) {
      const d = parseEventsGenerically(rawEventlist, this.transformText);

      combinedTimelineData = {
        start: this.startDate,
        end: this.endDate,
        items: d.items,
        groups: d.groups
      };
    }

    this.timeLineEventsData = combinedTimelineData;
    this.changeDetector.markForCheck();
  }

  public update(data: VisUpdateData) {
    this.listEventStoreData = data.listEventStoreData;
    this.startDate = data.startDate;
    this.endDate = data.endDate;

    this.pshowCorrelatedEvents = !this.checkAllOption();
    this.showCorrelatedBtn = this.pshowCorrelatedEvents;

    this.getTimelineData();
  }
}
