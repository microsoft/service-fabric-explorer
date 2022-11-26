import { Component, OnInit } from '@angular/core';
import Highcharts from 'highcharts';
import HC1 from 'highcharts/modules/networkgraph';
import HC2 from 'highcharts/modules/accessibility';
import HC3 from 'highcharts/modules/exporting';

HC1(Highcharts);
HC2(Highcharts);
HC3(Highcharts);

@Component({
  selector: 'app-newtab',
  templateUrl: './newtab.component.html',
  styleUrls: ['./newtab.component.scss']
})
export class NewtabComponent implements OnInit {

  Highcharts: typeof Highcharts = Highcharts;
  someData: string[][] = [
    ['0', '1'],
    ["1", "2"],
    ["2", "3"],
    ["3", "4"],
    ["4", "5"],
    ["5", "6"],
    ["6", "7"],
    ["7", "8"],
    ["8", "9"],
    ["9", "10"],
    ["10", "11"],
    ["11", "0"]
  ];

  constructor() { }

  ngOnInit(): void {

    Highcharts.chart('container', {
      chart: {
        renderTo: 'container',
        type: 'networkgraph',
        height: '100%'
      },
      title: {
        text: 'Federation'
      },
      plotOptions: {
        networkgraph: {
          //keys: ['from', 'to'],
          layoutAlgorithm: {
            enableSimulation: true,
            friction: -0.9
          }
        }
      },
      series: [{
        type: 'networkgraph',
        accessibility: {
          enabled: false
        },
        dataLabels: {
          enabled: true,
          linkFormat: ''
        },
        id: 'lang-tree',
        data: this.someData
      }]
    });
    
  }

}
