import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApplicationsRoutingModule } from './applications-routing.module';
import { BaseComponent } from './base/base.component';
import { AllComponent } from './all/all.component';
import { UpgradingComponent } from './upgrading/upgrading.component';
import { EventsComponent } from './events/events.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { EventStoreModule } from 'src/app/modules/event-store/event-store.module';


@NgModule({
  declarations: [BaseComponent, AllComponent, UpgradingComponent, EventsComponent],
  imports: [
    CommonModule,
    ApplicationsRoutingModule,
    SharedModule,
    DetailListTemplatesModule,
    EventStoreModule
  ]
})
export class ApplicationsModule { }
