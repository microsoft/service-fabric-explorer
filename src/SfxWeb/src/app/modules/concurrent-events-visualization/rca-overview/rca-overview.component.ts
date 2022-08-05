import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Chart, Options, chart, PointOptionsObject, SeriesPieOptions } from 'highcharts';
import { Utils } from 'src/app/Utils/Utils';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';
import { IVisEvent } from '../../event-store/event-store/event-store.component';

@Component({
  selector: 'app-rca-overview',
  templateUrl: './rca-overview.component.html',
  styleUrls: ['./rca-overview.component.scss']
})
export class RcaOverviewComponent implements OnInit {
  @Input() type: string;
  @Input() events: IVisEvent[];

  @ViewChild('chart') private chartContainer: ElementRef;
  private chart: Chart;

  public options: Options = {
    chart: {
      type: 'pie',
      backgroundColor: null,
      borderRadius: 0,
      margin: [0, 0, 0, 0],
      spacingTop: 0,
      spacingBottom: 0,
      spacingLeft: 0,
      spacingRight: 0,
      height: 150,
      width: 150
    },
    title: {
      text: '',
      // style: {
      //   color: '#1234',
      //   fontSize: '15pt'
      // }
    },
    exporting: {
      enabled: false
    },
    tooltip: {
      enabled: true,
      outside: true
      // animation: false,
      // formatter() {
      //   return `${this.point.name} : ${this.y}`;
      // }
    },
    credits: { enabled: false },
    loading: {
      showDuration: 0
    },
    plotOptions: {
      pie: {
        borderWidth: 2,
        innerSize: '50%',
        borderColor: '#262626'
      },
      series: {
        // dataLabels: {
        //   enabled: true,
        //   color: 'white',
        //   borderColor: 'white',
        //   inside: true,
        //   textPath: {
        //     enabled: false
        //   }
        // }
      }
    }
  };

  reasons: IEssentialListItem[] = [];

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
        }}
      }
    })
    this.options.series = [{ data: dataSet, type: 'pie' }]
    this.chart = chart(this.chartContainer.nativeElement, this.options);
  }

  ngOnInit(): void {
    this.reasons = Object.entries(Utils.groupByFunc(this.events, item => item.visEvent.reasonForEvent))
                          .sort((a,b) => b[1].length - a[1].length).map(reason => {
      return {
        displayText: reason[1].length.toString(),
        copyTextValue: reason[0] + ' ' + reason[1].toString(),
        descriptionName: reason[0]
      }
    })

    console.log(this.reasons)
  }

  ngOnChanges(): void {
    if (this.chart) {
      console.log("test")
      this.chart.series[0].setData(this.reasons.map(item => {
        return {
          y: +item.displayText,
          name: item.descriptionName
        }
      }));
    }
  }
}
