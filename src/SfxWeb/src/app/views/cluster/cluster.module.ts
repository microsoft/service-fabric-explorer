import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClusterRoutingModule } from './cluster-routing.module';
import { EssentialsComponent } from './essentials/essentials.component';
import { DetailsComponent } from './details/details.component';
import { BaseComponent } from './base/base.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { MetricsComponent } from './metrics/metrics.component';
import { ClustermapComponent } from './clustermap/clustermap.component';
import { ImagestoreComponent } from './imagestore/imagestore.component';
import { ManifestComponent } from './manifest/manifest.component';
import { EventsComponent } from './events/events.component';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { ImagestoreModule } from 'src/app/modules/imagestore/imagestore.module';
import { ActionUpdateBackupPolicyComponent } from './action-update-backup-policy/action-update-backup-policy.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActionCreateBackupPolicyComponent } from './action-create-backup-policy/action-create-backup-policy.component';
import { EventStoreModule } from 'src/app/modules/event-store/event-store.module';
import { ChartsModule } from 'src/app/modules/charts/charts.module';
import { StatusWarningsComponent } from './status-warnings/status-warnings.component';
import { BackupsComponent } from './backups/backups.component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { BackupRestoreModule } from 'src/app/modules/backup-restore/backup-restore.module';


@NgModule({
  declarations: [EssentialsComponent, DetailsComponent, BaseComponent, MetricsComponent, ClustermapComponent, ImagestoreComponent, ManifestComponent, EventsComponent, ActionUpdateBackupPolicyComponent, ActionCreateBackupPolicyComponent, StatusWarningsComponent, BackupsComponent],
  imports: [
    CommonModule,
    ClusterRoutingModule,
    SharedModule,
    DetailListTemplatesModule,
    ImagestoreModule,
    FormsModule,
    ReactiveFormsModule,
    EventStoreModule,
    ChartsModule,
    NgbDropdownModule,
    BackupRestoreModule
  ],
  entryComponents: [ActionUpdateBackupPolicyComponent, ActionCreateBackupPolicyComponent]
})
export class ClusterModule { }
