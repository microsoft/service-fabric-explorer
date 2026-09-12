import { Component, ElementRef, Input, Output, EventEmitter, OnChanges, OnDestroy, ViewChild, ChangeDetectionStrategy, inject } from '@angular/core';
import { Chart, Options, chart, PointOptionsObject } from 'highcharts';
import { IPregeneratedColor, pregeneratedColors } from 'src/app/Common/Constants';
import { IConcurrentEvents } from 'src/app/Models/eventstore/rcaEngine';
import { EventStoreUtils, ITimelineData, ITimelineItem } from 'src/app/Models/eventstore/timelineGenerators';
import { Utils } from 'src/app/Utils/Utils';
import { DataGroup } from 'vis-timeline/peer';
import { DataSet } from 'vis-data';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';
import { ExperienceService } from 'src/app/services/experience.service';

interface ExtendedListItem extends IEssentialListItem {
  key: string;
  label: string;
}

@Component({
    selector: 'app-rca-overview',
    templateUrl: './rca-overview.component.html',
    styleUrls: ['./rca-overview.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class RcaOverviewComponent implements OnChanges, OnDestroy {
  experience = inject(ExperienceService);
  @Input() type!: string;
  @Input() canInspect = false;
  @Output() selectEvent = new EventEmitter<string>();

  inspect(id: string) {
    const separator = id.indexOf('---');
    this.selectEvent.emit(separator < 0 ? id : id.slice(separator + 3));
  }
  @Input() events!: IConcurrentEvents[];

  @ViewChild('chart') private set chartContainer(container: ElementRef | undefined) {
    this.chart?.destroy();
    this.chart = undefined;
    if (container) {
      this.chart = chart(container.nativeElement, { ...this.options, series: [{ data: this.generateDataSet(this.reasons), type: 'pie' }] });
    }
  }
  private chart?: Chart;
  private preGeneratedColors = [...pregeneratedColors];
  public whiteLists = pregeneratedColors.map(c => "color-"+c).concat(['rca-summary-key']); //add all of the pregenerated safe timeline colors and the summary key item

  public options: Options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      borderRadius: 0,
      spacingTop: 0,
      spacingBottom: 0,
      spacingLeft: 0,
      spacingRight: 0,
      height: 150,
      width: 150
    },
    title: {
      text: '',
    },
    exporting: {
      enabled: false
    },
    tooltip: {
      enabled: true,
      outside: true
    },
    credits: { enabled: false },
    loading: {
      showDuration: 0
    },
    plotOptions: {
      pie: {
        borderWidth: 2,
        innerSize: '50%',
        borderColor: 'transparent',
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: false
        },
        showInLegend: false
      },
      series: {}
    }
  };

  public colorKey: Record<string, IPregeneratedColor> = {};
  public reasons: ExtendedListItem[] = [];
  public timelineData!: ITimelineData;
  public navigatorData!: ITimelineData;
  public trackDescriptions: Record<string, string> = {};

  constructor() { }

  generateDataSet(listItems: ExtendedListItem[]) {
    return listItems.map(item => {
      return {
        y: +item.displayText!,
        name: item.key,
        type: 'pie',
        dataLabels: {
          style: {
            fontSize: '15px',
            fontColor: '#fff'
          }
        },
        color: this.colorKey[item.key].hex
      }
    })
  }

  ngOnDestroy() { this.chart?.destroy(); }

  ngOnChanges(): void {
    const grouped = Object.entries(Utils.groupByFunc(this.events, item => {
      if (item?.reason && item.reason.name !== "self") {
        const list = this.reasonTreeToList(item);
        let key = list[0].kind;
        for (let i = 1; i < list.length; i++) {
          key += ` => ${list[i].kind}`;
        }

        return key
      } else if (item.reasonForEvent != " " && item.reasonForEvent) {
        return item.reasonForEvent;
      } else {
        return 'Unknown'
      }
    }));
    this.reasons = grouped.sort((a, b) => b[1].length - a[1].length).map(reason => {
      this.colorKey[reason[0]] = this.colorKey[reason[0]] || this.preGeneratedColors[
        Object.keys(this.colorKey).length % this.preGeneratedColors.length
      ];
      return {
        displayText: reason[1].length.toString(),
        copyTextValue: reason[0] + ' ' + reason[1].length.toString(),
        descriptionName: "",
        key: reason[0],
        label: reason[0],
        displaySelector: true,
        allowWrap: true
      }
    })

    this.trackDescriptions = {};
    this.reasons.forEach(reason => this.trackDescriptions[reason.label] = reason.key);

    const items = new DataSet<ITimelineItem>();
    const groups = new DataSet<DataGroup>();
    grouped.forEach((group, index) => {
      groups.add(
        { id: group[0], content: `<div class="color-${this.colorKey[group[0]].color} rca-summary-key"></div>` },
      )
      group[1].forEach(item => {
        const timelineItem = {
          id: `${index}---${item.eventInstanceId}`,
          content: '',
          start: item.timeStamp,
          group: group[0],
          type: 'point',
          kind: item.kind,
          groupColor: "color-" + this.colorKey[group[0]].color,
          title: EventStoreUtils.tooltipFormat(item.eventProperties, item.timeStamp),
          className: 'hidden-dot color-' + this.colorKey[group[0]].color,
          style: `border-width: 4px;
                  border-style: solid;
                  border-radius: 20px;`

        };
        items.add(timelineItem)
      })
    })

    this.timelineData = {
      groups,
      items,
      allowClustering: true
    }
    const navigatorItems = new DataSet<ITimelineItem>();
    const navigatorGroups = new DataSet<DataGroup>();
    const escape = (value: string) => {
      const element = document.createElement('div');
      element.textContent = value;
      return element.innerHTML;
    };
    // Compact track labels map to full explanations below; Classic keeps its color swatches.
    grouped.forEach(([reason, events], index) => {
      navigatorGroups.add({ id: reason, content: escape(this.reasons[index].label) });
      events.forEach(event => {
        const item = items.get(`${index}---${event.eventInstanceId}`)!;
        const explanation = `<table><tbody><tr><td>Reported reason</td><td>${escape(reason)}</td></tr></tbody></table>`;
        navigatorItems.add({ ...item, title: explanation + (item.title || '') });
      });
    });
    this.navigatorData = { items: navigatorItems, groups: navigatorGroups };

    if (this.chart) {
      const data = this.generateDataSet(this.reasons);
      this.chart.series[0].setData(data);
    }
  }

  reasonTreeToList(event: IConcurrentEvents): IConcurrentEvents[] {
    let next: IConcurrentEvents | null | undefined = event;
    const list = [];
    const seen = new Set<IConcurrentEvents>();
    while (next && !seen.has(next)) {
      seen.add(next);
      list.push(next)
      next = next.reason;
    }
    return list;
  }
}
