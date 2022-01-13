import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartRefDirective } from './chart-ref.directive';
import { DynamicChartsComponent } from './dynamic-charts/dynamic-charts.component';
import { BarChartComponent } from './bar-chart/bar-chart.component';
import { ResolveComponentComponent } from './resolve-component/resolve-component.component';
import { BadConfigurationComponent } from './bad-configuration/bad-configuration.component';
import { SharedModule } from 'src/app/shared/shared.module';



@NgModule({
  declarations: [
    ChartRefDirective,
    DynamicChartsComponent,
    BarChartComponent,
    ResolveComponentComponent,
    BadConfigurationComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [
    DynamicChartsComponent
  ]
})
export class DynamicDataViewerModule { }
