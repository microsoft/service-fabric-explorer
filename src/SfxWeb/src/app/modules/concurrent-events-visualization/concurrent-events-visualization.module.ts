import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisualizationToolComponent } from './visualization-tool/visualization-tool.component';

@NgModule({
  declarations: [
    VisualizationToolComponent
  ],
  imports: [
    CommonModule
  ],
  exports:[
    VisualizationToolComponent
  ]
})
export class ConcurrentEventsVisualizationModule { }
