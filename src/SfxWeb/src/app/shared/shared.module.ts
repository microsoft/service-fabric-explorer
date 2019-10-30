import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './component/navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { ClipBoardComponent } from './component/clip-board/clip-board.component';
import { HealthBadgeComponent } from './component/health-badge/health-badge.component';
import { DragDirective } from './directive/drag.directive';
import { UpgradeProgressComponent } from './component/upgrade-progress/upgrade-progress.component';
import { CandyBarCompactComponent } from './component/candy-bar-compact/candy-bar-compact.component';
import { DetailListComponent } from './component/detail-list/detail-list.component';
import { DetailViewPartComponent } from './component/detail-view-part/detail-view-part.component';
import { PagerComponent } from './component/pager/pager.component';
import { CollapseContainerComponent } from './component/collapse-container/collapse-container.component';



@NgModule({
  declarations: [NavbarComponent, ClipBoardComponent, HealthBadgeComponent, DragDirective, UpgradeProgressComponent, CandyBarCompactComponent, DetailListComponent, DetailViewPartComponent, PagerComponent, CollapseContainerComponent],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [NavbarComponent, ClipBoardComponent, HealthBadgeComponent, DragDirective, UpgradeProgressComponent, CandyBarCompactComponent, DetailListComponent, DetailViewPartComponent, PagerComponent, CollapseContainerComponent]
})
export class SharedModule { }
