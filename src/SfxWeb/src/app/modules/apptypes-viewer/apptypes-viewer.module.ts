import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApptypeViewerComponent } from './apptype-viewer/apptype-viewer.component';
import { ChartsModule } from '../charts/charts.module';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { SharedModule } from 'src/app/shared/shared.module';



@NgModule({
  declarations: [
    ApptypeViewerComponent
  ],
  imports: [
    CommonModule,
    ChartsModule,
    NgbNavModule,
    DetailListTemplatesModule,
    SharedModule
  ],
  exports: [
    ApptypeViewerComponent
  ]
})
export class ApptypesViewerModule { }
