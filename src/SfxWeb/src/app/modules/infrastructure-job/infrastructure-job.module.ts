import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfrastructureJobTileComponent } from './infrastructure-job-tile/infrastructure-job-tile.component';



@NgModule({
  declarations: [
    InfrastructureJobTileComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    InfrastructureJobTileComponent
  ]
})
export class InfrastructureJobModule { }
