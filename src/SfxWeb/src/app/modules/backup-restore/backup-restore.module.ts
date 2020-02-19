import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PartitionEnableBackUpComponent } from './partition-enable-back-up/partition-enable-back-up.component';
import { FormsModule } from '@angular/forms';
import { PartitionDisableBackUpComponent } from './partition-disable-back-up/partition-disable-back-up.component';
import { ViewBackupComponent } from './view-backup/view-backup.component';
import { SharedModule } from 'src/app/shared/shared.module';



@NgModule({
  declarations: [PartitionEnableBackUpComponent, PartitionDisableBackUpComponent, ViewBackupComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule
  ],
  exports: [PartitionEnableBackUpComponent, PartitionDisableBackUpComponent, ViewBackupComponent],
  entryComponents: [PartitionEnableBackUpComponent, PartitionDisableBackUpComponent, ViewBackupComponent]
})
export class BackupRestoreModule { }
