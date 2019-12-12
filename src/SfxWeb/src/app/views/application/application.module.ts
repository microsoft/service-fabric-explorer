import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApplicationRoutingModule } from './application-routing.module';
import { BaseComponent } from './base/base.component';
import { EssentialsComponent } from './essentials/essentials.component';
import { DetailsComponent } from './details/details.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DeploymentsComponent } from './deployments/deployments.component';
import { ManifestComponent } from './manifest/manifest.component';
import { EventsComponent } from './events/events.component';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { EventStoreModule } from 'src/app/modules/event-store/event-store.module';

@NgModule({
  declarations: [BaseComponent, EssentialsComponent, DetailsComponent, DeploymentsComponent, ManifestComponent, EventsComponent],
  imports: [
    CommonModule,
    ApplicationRoutingModule,
    SharedModule,
    DetailListTemplatesModule,
    EventStoreModule
  ]
})
export class ApplicationModule { }
