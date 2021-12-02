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
  //  legend: {
  //   enabled: false
  //  },
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
    series: [{
      name: 'Tokyo',
      data: [49.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]

  }, {
      name: 'New York',
      data: [83.6, 78.8, 98.5, 93.4, 106.0, 84.5, 105.0, 104.3, 91.2, 83.5, 106.6, 92.3]

  }, {
      name: 'London',
      data: [48.9, 38.8, 39.3, 41.4, 47.0, 48.3, 59.0, 59.6, 52.4, 65.2, 59.3, 51.2]

  }, {
      name: 'Berlin',
      data: [42.4, 33.2, 34.5, 39.7, 52.6, 75.5, 57.4, 60.4, 47.6, 39.1, 46.8, 51.1]

  } as any]

  };
  constructor() { }

  ngOnChanges(changes: SimpleChanges) {
    if (this.chart){
      while(this.chart.series.length > 0) {
        this.chart.series[0].remove()
      }

      this.mapData().forEach(item => {
        this.chart.addSeries(item);
      })

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
      }
    })
  }

  ngOnInit() {
    this.chart = chart('container', this.options);
  }

}
