import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Chart, Options, chart } from 'highcharts';
import { interval, Subscription } from 'rxjs';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { ITimedReplication } from '../replica-status-container/replica-status-container.component';
import { generateReplicationDeltas } from '../replication-utils';

export interface IChartData {
  date: Date;
  delta: number;
}

@Component({
  selector: 'app-replication-trend-line',
  templateUrl: './replication-trend-line.component.html',
  styleUrls: ['./replication-trend-line.component.scss']
})
export class ReplicationTrendLineComponent implements AfterViewInit, OnChanges, OnInit, OnDestroy {

  @Input() data: ITimedReplication[];
  @Input() fullScreen: boolean;
  @Input() showUTC = false;

  @ViewChild('chart') private chartContainer: ElementRef;

  private chart: Chart;

  fontColor = {
    color: '#fff'
  };

  sub: Subscription = new Subscription();

  constructor() { }

  ngOnInit() {
    this.sub.add(interval(1000).subscribe(() => this.setData()));
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  ngAfterViewInit(): void {
    const options: Options = {
      chart: {
        backgroundColor: null,
        type: 'area',
      },
      title: {
        text: ''
      },
      credits: {
        enabled: false
      },
      xAxis: {
        title: {
          style: this.fontColor
        },
        lineColor: '#fff',
        labels: {
          style: this.fontColor,
        },
      },
      yAxis: {
        title: {
          text: 'LSN / Sec',
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

    options.series = [{
      type: 'area',
      data: [],
      color: '#0075c9'
    }];

    this.chart = chart(this.chartContainer.nativeElement, options);
    // resize event needs to be triggered to properly default to container size
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
  }

  ngOnChanges() {
    this.setData();
  }

  setData() {
    if (this.data && this.data.length > 1) {
      const chartData = generateReplicationDeltas(this.data);

      if (this.chart) {
        this.chart.series[0].setData(chartData.map(item => item.delta));
        const now = new Date();
        now.setMilliseconds(0);
        this.chart.xAxis[0].setCategories(chartData.map(item => {
          if (this.showUTC) {
            return item.date.toUTCString();
          }else {
            item.date.setMilliseconds(0);
            const diff = now.getTime() - item.date.getTime();
            return TimeUtils.getDuration(diff) + ' ago';
          }
        }));
        window.dispatchEvent(new Event('resize'));
      }
    }
  }
}
