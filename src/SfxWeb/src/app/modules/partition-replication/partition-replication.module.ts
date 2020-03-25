import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReplicaStatusComponent } from './replica-status/replica-status.component';
import { ReplicaStatusContainerComponent } from './replica-status-container/replica-status-container.component';
import { SharedModule } from 'src/app/shared/shared.module';



@NgModule({
  declarations: [ReplicaStatusComponent, ReplicaStatusContainerComponent],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [ReplicaStatusComponent, ReplicaStatusContainerComponent]
})
export class PartitionReplicationModule { }
