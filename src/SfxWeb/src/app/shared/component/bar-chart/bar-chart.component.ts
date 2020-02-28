import { Component, OnInit, Input, SimpleChanges, OnChanges, AfterViewInit } from '@angular/core';
import { Chart, Options, chart  } from 'highcharts';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss']
})
export class BarChartComponent implements AfterViewInit, OnChanges {

  @Input() xAxisCategories: string[];
  @Input() dataSet: any[] = [];
  @Input() title: string = "";
  @Input() subtitle: string = "";

  private chart: Chart;

  fontColor = {
                color: "#fff"
              }

  public options: Options = {
    chart: {
      height: '50%',
      inverted: false,
      polar: false,
      animation: true,
      backgroundColor:"#191919"
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
    gridLineColor: "#fff",
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
      lineColor: "#fff",
      labels: {
        style: this.fontColor
      }
    },
    colorAxis: [{
      gridLineColor: "#fff"
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
  }
  constructor() { }

  ngOnChanges(changes: SimpleChanges) {
    if(this.chart){
      this.setData();
    }
  }

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    this.chart = chart('container', this.options);
    this.setData();
  }

  setData() {
    this.chart.series[0].setData(this.dataSet);
    this.chart.title.update({text: this.title})
    this.chart.subtitle.update({text: this.subtitle})
    this.chart.xAxis[0].update({categories: this.xAxisCategories})  
  }
}
