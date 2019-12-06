import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './component/navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClipBoardComponent } from './component/clip-board/clip-board.component';
import { HealthBadgeComponent } from './component/health-badge/health-badge.component';
import { DragDirective } from './directive/drag.directive';
import { UpgradeProgressComponent } from './component/upgrade-progress/upgrade-progress.component';
import { CandyBarCompactComponent } from './component/candy-bar-compact/candy-bar-compact.component';
import { DetailListComponent } from './component/detail-list/detail-list.component';
import { DetailViewPartComponent } from './component/detail-view-part/detail-view-part.component';
import { PagerComponent } from './component/pager/pager.component';
import { CollapseContainerComponent } from './component/collapse-container/collapse-container.component';
import { RefreshRateComponent } from './refresh-rate/refresh-rate.component';

import { DetailListTemplatesModule } from '../modules/detail-list-templates/detail-list-templates.module';
import { HyperLinkComponent } from '../modules/detail-list-templates/hyper-link/hyper-link.component';



@NgModule({
  declarations: [NavbarComponent, ClipBoardComponent, HealthBadgeComponent, DragDirective, UpgradeProgressComponent, CandyBarCompactComponent, DetailListComponent, DetailViewPartComponent, PagerComponent, CollapseContainerComponent, RefreshRateComponent],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DetailListTemplatesModule
  ],
  exports: [NavbarComponent, ClipBoardComponent, HealthBadgeComponent, DragDirective, UpgradeProgressComponent, CandyBarCompactComponent, DetailListComponent, DetailViewPartComponent, PagerComponent, CollapseContainerComponent, RefreshRateComponent],
  entryComponents: [HyperLinkComponent]
})
export class SharedModule { }
