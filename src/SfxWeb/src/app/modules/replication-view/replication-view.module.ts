import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReplicationViewerComponent } from './replication-viewer/replication-viewer.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [ReplicationViewerComponent],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    ReplicationViewerComponent
  ]
})
export class ReplicationViewModule { }
