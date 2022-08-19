import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { Chart, Options, chart, PointOptionsObject, SeriesPieOptions } from 'highcharts';
import { IConcurrentEvents } from 'src/app/Models/eventstore/rcaEngine';
import { EventStoreUtils, ITimelineData, ITimelineItem } from 'src/app/Models/eventstore/timelineGenerators';
import { Utils } from 'src/app/Utils/Utils';
import { DataGroup, DataItem, DataSet, IdType } from 'vis-timeline/standalone/esm';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-rca-overview',
  templateUrl: './rca-overview.component.html',
  styleUrls: ['./rca-overview.component.scss']
})
export class RcaOverviewComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() type: string;
  @Input() events: IConcurrentEvents[];

  @ViewChild('chart') private chartContainer: ElementRef;
  private chart: Chart;
  private preGeneratedColors = ['#2f7ed8', '#0d233a', '#8bbc21', '#910000', '#1aadce',
  '#492970', '#f28f43', '#77a1e5', '#a6c96a'];


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
        borderColor: '#262626',
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

  public colorKey: Record<string, string> = {};
  public reasons: IEssentialListItem[] = [];
  public timelineData: ITimelineData;

  constructor() { }

  ngAfterViewInit() {
    const dataSet: PointOptionsObject[] = this.reasons.map(item => {
      return {
        y: +item.displayText,
        name: item.descriptionName,
        type: 'pie',
        dataLabels: {
          style: {
            fontSize: '10px',
            fontColor: '#fff'
        }},
        color: this.colorKey[item.descriptionName]
      }
    })
    this.options.series = [{ data: dataSet, type: 'pie' }]
    this.chart = chart(this.chartContainer.nativeElement, this.options);
  }

  ngOnInit(): void {
    const grouped = Object.entries(Utils.groupByFunc(this.events, item =>{
      if(item?.reason && item.reason.name !== "self") {
        const list = this.reasonTreeToList(item);
        let key = list[0].kind;
        for(let i = 1; i < list.length; i++) {
          key += ` => ${list[i].kind}`;
        }

        return key
      }else if(item.reasonForEvent) {
        return item.reasonForEvent ;
      }else{
        return 'unknown'
      }
    }));
    this.reasons = grouped.sort((a,b) => b[1].length - a[1].length).map(reason => {
      this.colorKey[reason[0]] = this.colorKey[reason[0]] || this.preGeneratedColors.pop();
      return {
        displayText: reason[1].length.toString(),
        copyTextValue: reason[0] + ' ' + reason[1].length.toString(),
        descriptionName: reason[0],
        displaySelector: true,
        allowWrap: true
      }
    })
    console.log(this.reasons)

    const items = new DataSet<ITimelineItem>();
    const groups = new DataSet<DataGroup>();
    grouped.forEach((group, index) => {
      groups.add(
        {id: group[0], content: `<div style="background-color:${this.colorKey[group[0]]}; width: 15px; height: 15px; border-radius: 50px"></div>`},
      )
      group[1].forEach(item => {
        const timelineItem = {
          id: item.eventInstanceId,
          content: '',
          start: item.timeStamp,
          group: group[0],
          type: 'point',
          color: this.colorKey[group[0]],
          kind: item.kind,
          title: EventStoreUtils.tooltipFormat(item.eventProperties, item.eventInstanceId, item.timeStamp),
          className: 'hidden-dot',
          style:` border-color:${this.colorKey[group[0]]};
                  border-width: 4px;
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

  }

  reasonTreeToList(event: IConcurrentEvents): IConcurrentEvents[] {
    let next = event;
    const list = [];
    while(next) {
      list.push(next)
      next = next.reason;
    }
    return list;
  }

  ngOnChanges(): void {
    if (this.chart) {
      console.log("test")
      this.chart.series[0].setData(this.reasons.map(item => {
        return {
          y: +item.displayText,
          name: item.descriptionName,
          color: Utils.randomColor()
        }
      }));
    }
  }
}
