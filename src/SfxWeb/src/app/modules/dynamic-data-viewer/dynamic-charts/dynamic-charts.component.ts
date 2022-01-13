import { Component, Input, OnInit } from '@angular/core';
import { ChartConfiguration } from '../chartConfig.interface';

@Component({
  selector: 'app-dynamic-charts',
  templateUrl: './dynamic-charts.component.html',
  styleUrls: ['./dynamic-charts.component.scss']
})
export class DynamicChartsComponent implements OnInit {
  @Input() configs: ChartConfiguration[] = [];

  constructor() { }

  ngOnInit(): void {
  }

  trackByFn(index, chart: ChartConfiguration) {
    return chart.id + chart.type;
  }

}
