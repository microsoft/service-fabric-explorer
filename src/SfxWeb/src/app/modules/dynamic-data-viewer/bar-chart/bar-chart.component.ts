import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { chart, Chart, Options } from 'highcharts';
import { Utils } from 'src/app/Utils/Utils';
import { ChartComponent } from '../chartComponent.interface';
import { ChartConfiguration, ChartConfigurationBarChart } from '../chartConfig.interface';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarChartComponent implements OnDestroy, AfterViewInit, ChartComponent {

  configuration: ChartConfigurationBarChart;
  data = [];
  @ViewChild("chart") componentRef: ElementRef;

  private chart: Chart;

  fontColor = {
    color: '#fff'
  };

  public options: Options = {
    chart: {
      height: '50%',
      inverted: false,
      polar: false,
      animation: true,
      backgroundColor: null
    },
    title: {
      text: '',
      style: this.fontColor
    },
    subtitle: {
      text: '',
      style: this.fontColor

    },
    yAxis: {
      gridLineColor: '#fff',
      labels: {
        style: this.fontColor

      },
      title: {
        style: this.fontColor

      }
    },
    legend: {
      enabled: false
    },
    xAxis: {
      categories: [],
      lineColor: '#fff',
      labels: {
        style: this.fontColor
      }
    },
    colorAxis: [{
      gridLineColor: '#fff'
    }],
    series: [
      {
        name: '',
        type: 'column',
        data: [],
        dataLabels: {
          style: this.fontColor
        }
      }
    ]
  };
  constructor() { }

  ngAfterViewInit() {
    this.chart = chart(this.componentRef.nativeElement, this.options);
  }

  ngOnDestroy() {
    try {
      if(this.chart) {
        this.chart.destroy();
      }
    }catch(e) {
      console.error(e)
    }
  }

  setData(data) {
    if(!this.chart) {
     return
    }

      const dataSet = [];
      const labels = [];

      data.forEach(dataPoint => {
        const dataPointX = Utils.result(dataPoint, this.configuration.x);
        const dataPointY = Utils.result(dataPoint, this.configuration.y);

        dataSet.push(dataPointY);
        labels.push(dataPointX);
      })

      console.log(this.chart)
      this.chart.series[0].setData(dataSet);
      this.chart.xAxis[0].update({ categories: labels });

  }

  validateData(data) {
    return Array.isArray(data) ? '' : 'Data must be an array';
  }

}
