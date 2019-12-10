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


@NgModule({
  declarations: [EssentialsComponent, DetailsComponent, BaseComponent, MetricsComponent, ClustermapComponent, ImagestoreComponent, ManifestComponent, EventsComponent],
  imports: [
    CommonModule,
    ClusterRoutingModule,
    SharedModule,
    DetailListTemplatesModule,
    ImagestoreModule
  ]
})
export class ClusterModule { }
