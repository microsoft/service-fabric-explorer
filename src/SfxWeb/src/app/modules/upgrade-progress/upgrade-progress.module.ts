import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeUpgradeProgressComponent } from './node-upgrade-progress/node-upgrade-progress.component';
import { UpgradeDomainProgressComponent } from './upgrade-domain-progress/upgrade-domain-progress.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { PartitionInfoComponent } from './partition-info/partition-info.component';

@NgModule({
  declarations: [NodeUpgradeProgressComponent, UpgradeDomainProgressComponent, PartitionInfoComponent],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [
    UpgradeDomainProgressComponent
  ]
})
export class UpgradeProgressModule { }
