import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeDeactivationInfoComponent } from './node-deactivation-info/node-deactivation-info.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { UpgradeProgressModule } from '../upgrade-progress/upgrade-progress.module';



@NgModule({
  declarations: [NodeDeactivationInfoComponent],
  exports:[
    NodeDeactivationInfoComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    UpgradeProgressModule
  ]
})
export class NodeDeactivationModule { }
