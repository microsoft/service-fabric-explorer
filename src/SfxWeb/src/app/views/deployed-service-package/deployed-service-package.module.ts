import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeployedServicePackageRoutingModule } from './deployed-service-package-routing.module';
import { BaseComponent } from './base/base.component';
import { DetailsComponent } from './details/details.component';
import { ManifestComponent } from './manifest/manifest.component';
import { EssentialsComponent } from './essentials/essentials.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { ChartsModule } from 'src/app/modules/charts/charts.module';
import { HealthStateModule } from 'src/app/modules/health-state/health-state.module';
import { CommandsComponent } from './commands/commands.component';
import { PowershellCommandsModule } from 'src/app/modules/powershell-commands/powershell-commands.module';


@NgModule({
  declarations: [BaseComponent, DetailsComponent, ManifestComponent, EssentialsComponent, CommandsComponent],
  imports: [
    CommonModule,
    SharedModule,
    DeployedServicePackageRoutingModule,
    DetailListTemplatesModule,
    ChartsModule,
    HealthStateModule,
    PowershellCommandsModule
  ]
})
export class DeployedServicePackageModule { }
