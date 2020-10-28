import { Component, OnInit, ViewChild, ElementRef, Input, AfterViewInit, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { ITimelineData } from 'src/app/Models/eventstore/timelineGenerators';
import { Timeline, DataItem, DataGroup, moment, DataSet } from 'vis-timeline/standalone/esm';
@Component({
  selector: 'app-event-store-timeline',
  templateUrl: './event-store-timeline.component.html',
  styleUrls: ['./event-store-timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventStoreTimelineComponent implements AfterViewInit, OnChanges {

  @Input() events: ITimelineData;

  @Input() fitOnDataChange = true;
  @Input() displayMoveToStart = true;
  @Input() displayMoveToEnd = true;

  public isUTC = false;

  private timeline: Timeline;
  private start: Date;
  private end: Date;
  private oldestEvent: DataItem;
  private mostRecentEvent: DataItem;
  private firstEventsSet = true;

  @ViewChild('visualization') container: ElementRef;


  constructor() { }

  ngOnChanges() {
    if (this.timeline) {
        this.updateList(this.events);
        this.firstEventsSet = false;
    }
  }

  ngAfterViewInit() {

    const groups = new DataSet<DataGroup>([]);
    const items = new DataSet<DataItem>();

    // create visualization
    this.timeline = new Timeline(this.container.nativeElement, items, groups, {
        locale: 'en_US'
    });
    this.updateList(this.events);
  }

  public flipTimeZone() {
    this.timeline.setOptions({
        moment: this.isUTC ? moment : moment.utc
    });

    this.isUTC = !this.isUTC;
  }

  public fitData() {
    this.timeline.fit();
  }

  public fitWindow() {
      this.timeline.setWindow(this.start, this.end);
  }

  public moveStart() {
      this.timeline.moveTo(this.start);
  }

  public moveEnd() {
      this.timeline.moveTo(this.end);
  }

  public moveToOldestEvent() {
      if (this.oldestEvent) {
          this.timeline.setWindow(this.oldestEvent.start, this.oldestEvent.end);
      }
  }

  public moveToNewestEvent() {
      if (this.mostRecentEvent) {
          this.timeline.setWindow(this.mostRecentEvent.start, this.mostRecentEvent.end);
      }
  }

    public updateList(events: ITimelineData) {
        if (events.start) {
            this.timeline.setOptions({
                min: events.start,
            });
            this.start = events.start;
        }
        if (events.end) {
            this.end = events.end;
            this.timeline.setOptions({
                max: events.end,
            });
        }

        if (events) {
            this.timeline.setData({
                groups: events.groups,
                items: events.items
            });

            console.log(this.firstEventsSet)
            this.timeline.setOptions({
                selectable: false,
                margin: {
                    item: {
                        horizontal: -1 // this makes it so items dont stack up when zoomed out too far.,
                    }
                },
                tooltip: {
                    overflowMethod: 'flip'
                }, stack: true,
                stackSubgroups: true,
                maxHeight: '700px',
                verticalScroll: true,
                width: '95%',
                zoomMin: this.firstEventsSet ? 10800000 : 60000
            });

            if (this.fitOnDataChange) {
                this.timeline.fit();
            }

            if (events.items.length > 0) {
                let oldest = null;
                let newest = null;

                events.items.forEach(item => {
                    // cant easily grab the first elements of the collection, easier to set here
                    if (!oldest && !newest) {
                        oldest = item;
                        newest = item;
                    }
                    if (oldest.start > item.start) {
                        oldest = item;
                    }
                    if (newest.end < item.end) {
                        newest = item;
                    }
                });
                this.mostRecentEvent = newest;
                this.oldestEvent = oldest;
            }
        } else {
            this.mostRecentEvent = null;
            this.oldestEvent = null;
            this.timeline.zoomOut(1);
        }
    }

}
