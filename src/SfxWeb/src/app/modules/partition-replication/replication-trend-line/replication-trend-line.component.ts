import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Chart, Options, chart  } from 'highcharts';

@Component({
  selector: 'app-replication-trend-line',
  templateUrl: './replication-trend-line.component.html',
  styleUrls: ['./replication-trend-line.component.scss']
})
export class ReplicationTrendLineComponent implements AfterViewInit {

  @Input() data: number[]

  @ViewChild('chart') private chartContainer: ElementRef;

  private chart: Chart;

  constructor() { }

  ngAfterViewInit(): void {
    const testOptions: Options = {
      chart: {
          backgroundColor: null,
          borderWidth: 0,
          type: 'area',
          margin: [2, 0, 2, 0],
          width: 240,
          height: 40,
          style: {
              overflow: 'visible'
          },
      },
      title: {
          text: ''
      },
      credits: {
          enabled: false
      },
      xAxis: {
          labels: {
              enabled: false
          },
          title: {
              text: null
          },
          startOnTick: false,
          endOnTick: false,
          tickPositions: []
      },
      yAxis: {
          endOnTick: false,
          startOnTick: false,
          labels: {
              enabled: false
          },
          title: {
              text: null
          },
          tickPositions: [0]
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
      this.chart.series[0].setData(this.data);
    }
  }

}
