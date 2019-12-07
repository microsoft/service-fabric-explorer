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

@NgModule({
  declarations: [NavbarComponent, ClipBoardComponent, HealthBadgeComponent, UpgradeProgressComponent, CandyBarCompactComponent, DetailViewPartComponent, CollapseContainerComponent, RefreshRateComponent],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
  ],
  exports: [NavbarComponent, ClipBoardComponent, HealthBadgeComponent, UpgradeProgressComponent, CandyBarCompactComponent, DetailViewPartComponent, CollapseContainerComponent, RefreshRateComponent],
})
export class SharedModule { }
