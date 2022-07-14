import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisualizationToolComponent } from './visualization-tool/visualization-tool.component';
import { VisualizationLogoComponent } from './visualization-logo/visualization-logo.component';

@NgModule({
  declarations: [
    VisualizationToolComponent,
    VisualizationLogoComponent
  ],
  imports: [
    CommonModule
  ],
  exports:[
    VisualizationToolComponent
  ]
})
export class ConcurrentEventsVisualizationModule { }
