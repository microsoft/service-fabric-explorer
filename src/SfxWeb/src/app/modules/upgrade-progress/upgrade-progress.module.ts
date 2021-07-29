import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpgradeDomainProgressComponent } from './upgrade-domain-progress/upgrade-domain-progress.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { PartitionInfoComponent } from './partition-info/partition-info.component';
import { UpgradeProgressComponent } from './upgrade-progress/upgrade-progress.component';
import { SafetyChecksComponent } from './safety-checks/safety-checks.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NodeProgressComponent } from './node-progress/node-progress.component';

@NgModule({
  declarations: [UpgradeDomainProgressComponent, PartitionInfoComponent, UpgradeProgressComponent, SafetyChecksComponent, NodeProgressComponent],
  imports: [
    CommonModule,
    SharedModule,
    NgbTooltipModule
  ],
  exports: [
    UpgradeDomainProgressComponent,
    UpgradeProgressComponent,
    SafetyChecksComponent,
    NodeProgressComponent,
  ]
})
export class UpgradeProgressModule { }
