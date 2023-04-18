import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { Chart, Options, chart, PointOptionsObject } from 'highcharts';
import { IPregeneratedColor, pregeneratedColors } from 'src/app/Common/Constants';
import { IConcurrentEvents } from 'src/app/Models/eventstore/rcaEngine';
import { EventStoreUtils, ITimelineData, ITimelineItem } from 'src/app/Models/eventstore/timelineGenerators';
import { Utils } from 'src/app/Utils/Utils';
import { DataGroup, DataSet } from 'vis-timeline/standalone/esm';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';

interface ExtendedListItem extends IEssentialListItem {
  key: string;
}

@Component({
  selector: 'app-rca-overview',
  templateUrl: './rca-overview.component.html',
  styleUrls: ['./rca-overview.component.scss']
})
export class RcaOverviewComponent implements AfterViewInit, OnChanges {
  @Input() type: string;
  @Input() events: IConcurrentEvents[];

  @ViewChild('chart') private chartContainer: ElementRef;
  private chart: Chart;
  private preGeneratedColors = [...pregeneratedColors];
  public whiteLists = pregeneratedColors.map(c => "color-"+c).concat(['rca-summary-key']); //add all of the pregenerated safe timeline colors and the summary key item

  public options: Options = {
    chart: {
      type: 'pie',
      backgroundColor: null,
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
        borderColor: null,
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
  public timelineData: ITimelineData;

  constructor() { }

  generateDataSet(listItems: ExtendedListItem[]) {
    return listItems.map(item => {
      return {
        y: +item.displayText,
        name: item.key,
        type: 'pie',
        dataLabels: {
          style: {
            fontSize: '10px',
            fontColor: '#fff'
          }
        },
        color: this.colorKey[item.key].hex
      }
    })
  }

  ngAfterViewInit() {
    const data = this.generateDataSet(this.reasons);
    this.options.series = [{ data, type: 'pie' }]
    this.chart = chart(this.chartContainer.nativeElement, this.options);
  }

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
      this.colorKey[reason[0]] = this.colorKey[reason[0]] || this.preGeneratedColors.pop();
      return {
        displayText: reason[1].length.toString(),
        copyTextValue: reason[0] + ' ' + reason[1].length.toString(),
        descriptionName: "",
        key: reason[0],
        displaySelector: true,
        allowWrap: true
      }
    })

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
      items: items as any,
      allowClustering: true
    }

    if (this.chart) {
      const data = this.generateDataSet(this.reasons);
      this.chart.series[0].setData(data);
    }
  }

  reasonTreeToList(event: IConcurrentEvents): IConcurrentEvents[] {
    let next = event;
    const list = [];
    while (next) {
      list.push(next)
      next = next.reason;
    }
    return list;
  }
}
