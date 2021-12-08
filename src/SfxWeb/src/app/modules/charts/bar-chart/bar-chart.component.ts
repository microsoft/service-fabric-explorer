import { Component, OnInit, Input, SimpleChanges, OnChanges } from '@angular/core';
import { Chart, Options, chart, SeriesOptionsType  } from 'highcharts';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss']
})
export class BarChartComponent implements OnInit, OnChanges {

  @Input() xAxisCategories: string[];
  @Input() dataSet: any[] = [];
  @Input() title = '';
  @Input() subtitle = '';

  private chart: Chart;

  fontColor = {
                color: '#fff'
              };

  public options: Options = {
    chart: {
      type: 'column',
      height: '50%',
      inverted: false,
      polar: false,
      animation: true,
      backgroundColor: '#191919'
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
    series: []

  };
  constructor() { }

  ngOnChanges(changes: SimpleChanges) {
    if (this.chart){

      this.chart.series.forEach(series => {
        if (this.dataSet.every(set => set.label !== series.name)) {
          series.remove();
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

  ngOnInit() {
    this.chart = chart('container', this.options);
  }

}
