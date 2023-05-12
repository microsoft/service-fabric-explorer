import { Component, OnInit, Input, OnChanges, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Chart, Options, chart, SeriesOptionsType, TooltipFormatterCallbackFunction  } from 'highcharts';
import { IChartSeries } from 'src/app/views/cluster/metrics/metrics.component';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss']
})
export class BarChartComponent implements AfterViewInit, OnChanges, OnDestroy {

  @Input() xAxisCategories: string[];
  @Input() dataSet: IChartSeries[] = [];
  @Input() title = '';
  @Input() subtitle = '';
  @Input() tooltip: TooltipFormatterCallbackFunction;

  private chart: Chart;
  @ViewChild('container') private container: ElementRef;

  fontColor = {
                color: '#fff'
              };

  public options: Options = {
    chart: {
      type: 'column',
      inverted: false,
      polar: false,
      animation: true,
      backgroundColor: 'transparent',
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
      itemStyle: this.fontColor
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
    series: [],
    credits: {
      enabled: false
    }

  };
  constructor() { }

  ngOnChanges() {
    if (this.chart){

      this.chart.series.forEach(series => {
        if (this.dataSet.every(set => set.label !== series.name)) {
          series.remove();
        }else{
          series.update(this.dataSet.find(set => set.label === series.name));
        }
      });

      this.mapData().forEach(item => {
        if (this.chart.series.every(set => set.name !== item.name)) {
          this.chart.addSeries(item);
        }
      });

      this.chart.title.update({text: this.title});
      this.chart.subtitle.update({text: this.subtitle});
      this.chart.xAxis[0].update({categories: this.xAxisCategories});

        this.chart.tooltip.update({formatter: this.tooltip});
    }
  }

  mapData(): SeriesOptionsType[] {
    return this.dataSet.map<SeriesOptionsType>( (data, index) => {
      return {
        name: data.label,
        type: 'column',
        data: data.data,
        dataLabels: {
          style: this.fontColor
        }
      };
    });
  }

  ngAfterViewInit() {
    this.chart = chart(this.container.nativeElement, this.options);
  }

  ngOnDestroy() {
    if(this.chart) {
      this.chart.destroy();
    }
  }
}
