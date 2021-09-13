import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Chart, Options, chart  } from 'highcharts';
import { TimeUtils } from 'src/app/Utils/TimeUtils';

export interface IChartData {
  date: Date;
  delta: number;
}

@Component({
  selector: 'app-replication-trend-line',
  templateUrl: './replication-trend-line.component.html',
  styleUrls: ['./replication-trend-line.component.scss']
})
export class ReplicationTrendLineComponent implements AfterViewInit {

  @Input() data: IChartData[]

  @ViewChild('chart') private chartContainer: ElementRef;

  private chart: Chart;

  fontColor = {
    color: '#fff'
  };

  constructor() { }

  ngAfterViewInit(): void {
    const testOptions: Options = {
      chart: {
          backgroundColor: null,
          // borderWidth: 0,
          type: 'area',
          // margin: [2, 0, 2, 0],
          width: 240,
          height: 185,
      },
      title: {
          text: ''
      },
      credits: {
          enabled: false
      },
      xAxis: {
        title: {
          // text: 'LSN change',
          style: this.fontColor
      },
      lineColor: '#fff',
      labels: {
        style: this.fontColor,
      },
    },
      yAxis: {
        title: {
            text: 'LSN change',
            style: this.fontColor
        },
        lineColor: '#fff',
        labels: {
          style: this.fontColor,
        },

    },
      legend: {
          enabled: false
      },
      tooltip: {
          hideDelay: 0,
          outside: true,
          shared: true
      },
      plotOptions: {
          series: {
              animation: false,
              lineWidth: 1,
              shadow: false,
              states: {
                  hover: {
                      lineWidth: 1
                  }
              },
              marker: {
                  radius: 1,
                  states: {
                      hover: {
                          radius: 2
                      }
                  }
              },
          },
          column: {
              negativeColor: '#910000',
              borderColor: 'silver'
          }
      }
  };

  testOptions.series = [{
    type: 'area',
    data: [],
    color: '#0075c9'
  }]
    // const options: Options = {
    //   series: [{
    //     type: 'area',
    //     data: [1,2,3,4]
    //   }]
    // }

    this.chart = chart(this.chartContainer.nativeElement, testOptions);

  }

  ngOnChanges() {
    if (this.chart) {
      this.chart.series[0].setData(this.data.map(item => item.delta));

      // formatter() { console.log(this); const diff = this.value.getTime() - new Date().getTime(); return TimeUtils.getDuration(diff); }

      const now = new Date();
      now.setMilliseconds(0)
      this.chart.xAxis[0].setCategories(this.data.map(item => {
        item.date.setMilliseconds(0)
        const diff = now.getTime() -  item.date.getTime();
        return TimeUtils.getDuration(diff) + " ago"
      }))
    }
  }

}
