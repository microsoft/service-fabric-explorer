import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlacementConstraintViewerComponent } from './placement-constraint-viewer/placement-constraint-viewer.component';
import { PlacementConstraintResultComponent } from './placement-constraint-result/placement-constraint-result.component';
import { QuickViewComponent } from './quick-view/quick-view.component';
import { ChartsModule } from '../charts/charts.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';



@NgModule({
  declarations: [    PlacementConstraintViewerComponent,
    PlacementConstraintResultComponent,
    QuickViewComponent],
  imports: [
    CommonModule,
    ChartsModule,
    SharedModule,
    DetailListTemplatesModule
  ],
  exports: [
    PlacementConstraintViewerComponent
  ]
})
export class PlacementConstraintsModule { }
