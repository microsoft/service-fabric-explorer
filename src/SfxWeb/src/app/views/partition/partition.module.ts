import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PartitionRoutingModule } from './partition-routing.module';
import { BaseComponent } from './base/base.component';
import { EssentialsComponent } from './essentials/essentials.component';
import { DetailsComponent } from './details/details.component';
import { EventsComponent } from './events/events.component';
import { BackupsComponent } from './backups/backups.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { EventStoreModule } from 'src/app/modules/event-store/event-store.module';
import { BackupRestoreModule } from 'src/app/modules/backup-restore/backup-restore.module';
import { PartitionReplicationModule } from 'src/app/modules/partition-replication/partition-replication.module';
import { PartitionRestoreBackUpComponent } from './partition-restore-back-up/partition-restore-back-up.component';
import { PartitionTriggerBackUpComponent } from './partition-trigger-back-up/partition-trigger-back-up.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BackupinfoComponent } from './backupinfo/backupinfo.component';
import { ChartsModule } from 'src/app/modules/charts/charts.module';
import { HealthStateModule } from 'src/app/modules/health-state/health-state.module';
import { CommandsComponent } from './commands/commands.component';
import { PowershellCommandsModule } from 'src/app/modules/powershell-commands/powershell-commands.module';


@NgModule({
  declarations: [BaseComponent, EssentialsComponent, DetailsComponent, EventsComponent, BackupsComponent, PartitionRestoreBackUpComponent, PartitionTriggerBackUpComponent, BackupinfoComponent, CommandsComponent],
  imports: [
    CommonModule,
    PartitionRoutingModule,
    SharedModule,
    DetailListTemplatesModule,
    EventStoreModule,
    BackupRestoreModule,
    ReactiveFormsModule,
    PartitionReplicationModule,
    FormsModule,
    ChartsModule,
    HealthStateModule,
    PowershellCommandsModule
  ],
  exports: [BackupinfoComponent]
})
export class PartitionModule { }
