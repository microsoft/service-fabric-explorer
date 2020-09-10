import { Component, OnInit, ViewChild, ElementRef, Input, AfterViewInit, OnChanges, ChangeDetectionStrategy } from '@angular/core';
// import * as vis from 'vis';
import { ITimelineData } from 'src/app/Models/eventstore/timelineGenerators';
import { Timeline, DataItem, DataSet, DataGroup, moment } from 'vis-timeline/standalone';

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

  private _timeline: Timeline;
  private _start: Date;
  private _end: Date;
  private _oldestEvent: DataItem;
  private _mostRecentEvent: DataItem;
  private _firstEventsSet = true;

  @ViewChild('visualization') container: ElementRef;


  constructor() { }

  ngOnChanges() {
    if (this._timeline) {
        this.updateList(this.events);
        this._firstEventsSet = false;
    }
  }

  ngAfterViewInit() {

    const groups = new DataSet<DataGroup>([]);
    const items = new DataSet<DataItem>();

    // create visualization
    this._timeline = new Timeline(this.container.nativeElement, items, groups, {
        locale: 'en_US'
    });
    this.updateList(this.events);
  }

  public flipTimeZone() {
    this._timeline.setOptions({
        moment: this.isUTC ? moment : moment.utc
    });

    this.isUTC = !this.isUTC;
  }

  public fitData() {
    this._timeline.fit();
  }

  public fitWindow() {
      this._timeline.setWindow(this._start, this._end);
  }

  public moveStart() {
      this._timeline.moveTo(this._start);
  }

  public moveEnd() {
      this._timeline.moveTo(this._end);
  }

  public moveToOldestEvent() {
      if (this._oldestEvent) {
          this._timeline.setWindow(this._oldestEvent.start, this._oldestEvent.end);
      }
  }

  public moveToNewestEvent() {
      if (this._mostRecentEvent) {
          this._timeline.setWindow(this._mostRecentEvent.start, this._mostRecentEvent.end);
      }
  }

    public updateList(events: ITimelineData) {
        if (events.start) {
            this._timeline.setOptions({
                min: events.start,
            });
            this._start = events.start;
        }
        if (events.end) {
            this._end = events.end;
            this._timeline.setOptions({
                max: events.end,
            });
        }

        if (events) {
            this._timeline.setData({
                groups: events.groups,
                items: events.items
            });

            this._timeline.setOptions({
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
                zoomMin: this._firstEventsSet ? 10800000 : 10
            });

            if (this.fitOnDataChange) {
                this._timeline.fit();
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
                this._mostRecentEvent = newest;
                this._oldestEvent = oldest;
            }
        } else {
            this._mostRecentEvent = null;
            this._oldestEvent = null;
            this._timeline.zoomOut(1);
        }
    }

}
