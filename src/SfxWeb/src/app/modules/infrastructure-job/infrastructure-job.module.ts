import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfrastructureJobTileComponent } from './infrastructure-job-tile/infrastructure-job-tile.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { StripPrefixPipe } from './strip-prefix.pipe';
import { RepairTasksModule } from '../repair-tasks/repair-tasks.module';



@NgModule({
  declarations: [
    InfrastructureJobTileComponent,
    StripPrefixPipe
  ],
  imports: [
    CommonModule,
    SharedModule,
    DetailListTemplatesModule,
    RepairTasksModule,
    NgbNavModule
  ],
  exports: [
    InfrastructureJobTileComponent,
    StripPrefixPipe
  ]
})
export class InfrastructureJobModule { }
