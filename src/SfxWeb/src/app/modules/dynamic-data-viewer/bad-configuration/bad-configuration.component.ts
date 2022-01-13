import { Component, Input, OnInit } from '@angular/core';
import { ChartComponent } from '../chartComponent.interface';
import { ChartConfigurationBarChart } from '../chartConfig.interface';

@Component({
  selector: 'app-bad-configuration',
  templateUrl: './bad-configuration.component.html',
  styleUrls: ['./bad-configuration.component.scss']
})
export class BadConfigurationComponent implements OnInit, ChartComponent {

  configuration: ChartConfigurationBarChart;
  constructor() { }

  ngOnInit(): void {
  }

  setData(data) {};
  validateData(data) { return ''};
}
