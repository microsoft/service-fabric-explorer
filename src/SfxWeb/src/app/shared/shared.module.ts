import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './component/navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClipBoardComponent } from './component/clip-board/clip-board.component';
import { HealthBadgeComponent } from './component/health-badge/health-badge.component';
import { UpgradeProgressComponent } from './component/upgrade-progress/upgrade-progress.component';
import { CandyBarCompactComponent } from './component/candy-bar-compact/candy-bar-compact.component';
import { DetailViewPartComponent } from './component/detail-view-part/detail-view-part.component';
import { CollapseContainerComponent } from './component/collapse-container/collapse-container.component';
import { RefreshRateComponent } from './refresh-rate/refresh-rate.component';
import { DragDirective } from './directive/drag.directive';
import { ActionDialogComponent } from './component/action-dialog/action-dialog.component';
import { ManifestComponent } from './component/manifest/manifest.component';

@NgModule({
  declarations: [NavbarComponent, ClipBoardComponent, HealthBadgeComponent, UpgradeProgressComponent, CandyBarCompactComponent, DetailViewPartComponent, CollapseContainerComponent, RefreshRateComponent, DragDirective, ActionDialogComponent, ManifestComponent],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
  ],
  exports: [NavbarComponent, ClipBoardComponent, HealthBadgeComponent, UpgradeProgressComponent, CandyBarCompactComponent, DetailViewPartComponent, CollapseContainerComponent, RefreshRateComponent, DragDirective, ActionDialogComponent, ManifestComponent],
  entryComponents: [ActionDialogComponent],
})
export class SharedModule { }
