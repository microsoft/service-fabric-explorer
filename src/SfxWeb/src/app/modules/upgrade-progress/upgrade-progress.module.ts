import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpgradeDomainProgressComponent } from './upgrade-domain-progress/upgrade-domain-progress.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { UpgradeProgressComponent } from './upgrade-progress/upgrade-progress.component';
import { SafetyChecksComponent } from './safety-checks/safety-checks.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NodeProgressComponent } from './node-progress/node-progress.component';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { LoadCellComponent } from './load-cell/load-cell.component';
import { UpgradeInfoComponent } from './upgrade-info/upgrade-info.component';
import { HealthPolicyCheckComponent } from './health-policy-check/health-policy-check.component';

@NgModule({
  declarations: [UpgradeDomainProgressComponent, UpgradeProgressComponent, SafetyChecksComponent, NodeProgressComponent, LoadCellComponent, UpgradeInfoComponent, HealthPolicyCheckComponent],
  imports: [
    CommonModule,
    SharedModule,
    NgbTooltipModule,
    DetailListTemplatesModule
  ],
  exports: [
    UpgradeDomainProgressComponent,
    UpgradeProgressComponent,
    SafetyChecksComponent,
    NodeProgressComponent,
    UpgradeInfoComponent
  ]
})
export class UpgradeProgressModule { }
