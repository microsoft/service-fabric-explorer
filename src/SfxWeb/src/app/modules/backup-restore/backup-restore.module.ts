import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PartitionEnableBackUpComponent } from './partition-enable-back-up/partition-enable-back-up.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PartitionDisableBackUpComponent } from './partition-disable-back-up/partition-disable-back-up.component';
import { ViewBackupComponent } from './view-backup/view-backup.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { StorageFormComponent } from './storage-form/storage-form.component';



@NgModule({
  declarations: [PartitionEnableBackUpComponent, PartitionDisableBackUpComponent, ViewBackupComponent, StorageFormComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    ReactiveFormsModule
  ],
  exports: [PartitionEnableBackUpComponent, PartitionDisableBackUpComponent, ViewBackupComponent, StorageFormComponent],
  entryComponents: [PartitionEnableBackUpComponent, PartitionDisableBackUpComponent, ViewBackupComponent]
})
export class BackupRestoreModule { }
