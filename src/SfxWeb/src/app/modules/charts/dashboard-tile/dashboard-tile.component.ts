import { Component, OnInit, ViewChild, ElementRef, Input, AfterViewInit } from '@angular/core';
import { IDashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { Chart, Options, chart  } from 'highcharts';

@Component({
  selector: 'app-dashboard-tile',
  templateUrl: './dashboard-tile.component.html',
  styleUrls: ['./dashboard-tile.component.scss']
})
export class DashboardTileComponent implements OnInit, AfterViewInit {

  @Input() data: IDashboardViewModel;

  @ViewChild('chart') private chartContainer: ElementRef;

  public dimension: number = 200;

  private chart: Chart;

  fontColor = {
    color: "#fff"
  }

  public options: Options = {
    chart: {
        type: 'pie',
        backgroundColor: null,
        borderRadius: 0,
        // animation: false
    },
    title: {
        text: 'test',
        align: 'left',
        verticalAlign: 'middle',
        y: 0,
        x: 10,
        style: {
          color: "#fff",
          fontSize: "15pt"
        }
      },
    subtitle: {
      text: "5",
      align: 'left',
      verticalAlign: 'middle',
      x: 25,
      y: 50,
      style: {
        color: "#fff",
        fontSize: "28pt"
      }
    },
    tooltip:{ enabled: false, animation: false },
    credits: { enabled: false },
    loading: {
      showDuration: 0
    },
    plotOptions: {
        pie: {
                    dataLabels: {
                enabled: false,
                distance: -50,
                style: {
                    fontWeight: 'bold',
                    color: 'white'
                }
            },
            innerSize: '90%',
          startAngle: -50,
            endAngle: 230,
        }
    },
    series: [{
      type: "pie",
      data:
        [
          {
            name: "",
            y: 1,
            color: "gray"
          }
        ],
        states: {
          inactive: {
            opacity: 1
          },
          hover: {
            opacity: 1
          }
        }
  }]
  };

  constructor() { }

  ngOnInit() {
    let margin = 3;
    let width = (this.data.largeTile ? 200 : 140) + margin * 2;
    this.dimension = width;
    this.options.chart.height = this.dimension;
    this.options.chart.width = this.dimension;

    if(!this.data.largeTile) {
      this.options.title.style.fontSize = '13pt';
      this.options.subtitle.style.fontSize = '13pt';
      this.options.title.y = 9;
      // this.options.title.x = -2;
      this.options.subtitle.y = 30;

    }
    this.ngOnChanges();
  }
  
  ngAfterViewInit(){
    this.chart = chart(this.chartContainer.nativeElement, this.options);
    console.log(this.data)
  }

  ngOnChanges() {
    // const series = 
    //       [{name:'Ok', y: 5, color: "green"},
    //       {name:'Warning', y: 4, color: "yellow"},
    //       {name:'Error', y: 3, color: "red"}]
    
    const colors = {
      'Ok': "green",
      'Warning': 'yellow',
      'Error': 'red'
    }

    const data = this.data.dataPoints.map(p => {
      return {
        name: p.title,
        y: p.count,
        color: colors[p.title]
      }
    });

    if(data.every(d => d.y  === 0)) {
      data.push({
        name: "",
        y: 1,
        color: "gray"
      });
    }

    if(this.chart){
      // this.chart.update({chart: {animation: true }});
      this.chart.series[0].setData(data);
      this.chart.title.update({text: `${this.data.displayTitle}`}) //${this.data.count}
      // this.chart.subtitle.update({text: this.subtitle})
      // this.chart.xAxis[0].update({categories: this.xAxisCategories})  
    }
  }

}
