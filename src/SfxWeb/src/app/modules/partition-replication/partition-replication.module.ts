import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReplicaStatusComponent } from './replica-status/replica-status.component';
import { ReplicaStatusContainerComponent } from './replica-status-container/replica-status-container.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReplicaTileComponent } from './replica-tile/replica-tile.component';
import { ChartsModule } from '../charts/charts.module';



@NgModule({
  declarations: [ReplicaStatusComponent, ReplicaStatusContainerComponent, ReplicaTileComponent],
  imports: [
    CommonModule,
    SharedModule,
    ChartsModule
  ],
  exports: [ReplicaStatusComponent, ReplicaStatusContainerComponent]
})
export class PartitionReplicationModule { }
