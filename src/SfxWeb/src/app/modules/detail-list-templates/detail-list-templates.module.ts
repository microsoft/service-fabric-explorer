import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HyperLinkComponent } from './hyper-link/hyper-link.component';
import { ResolverDirective } from 'src/app/modules/detail-list-templates/resolver.directive';
import { DetailTableResolverComponent } from './detail-table-resolver/detail-table-resolver.component';
import { RouterModule } from '@angular/router';
import { CopyTextComponent } from './copy-text/copy-text.component';
import { DetailListComponent } from './detail-list/detail-list.component';
import { PagerComponent } from './pager/pager.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgbPaginationModule, NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { UtcTimestampComponent } from './utc-timestamp/utc-timestamp.component';
import { ExportModalComponent } from './export-modal/export-modal.component';
import { QuestionToolTipComponent } from './question-tool-tip/question-tool-tip.component';
import { ShortenComponent } from './shorten/shorten.component';
import { CustomTrackByPipe } from './custom-track-by.pipe';
import { HealthbadgeComponent } from './healthbadge/healthbadge.component';
import { FullDescriptionComponent } from './full-description/full-description.component';



@NgModule({
  declarations: [HyperLinkComponent, DetailTableResolverComponent, ResolverDirective, CopyTextComponent, ResolverDirective, FullDescriptionComponent,
                 DetailListComponent, PagerComponent, UtcTimestampComponent, ExportModalComponent, QuestionToolTipComponent, ShortenComponent, CustomTrackByPipe, HealthbadgeComponent],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    NgbPaginationModule,
    NgbDropdownModule,
    NgbTooltipModule,
    FormsModule
  ],
  exports: [DetailTableResolverComponent, HyperLinkComponent, CopyTextComponent, DetailListComponent, QuestionToolTipComponent, ShortenComponent, HealthbadgeComponent, FullDescriptionComponent]
})
export class DetailListTemplatesModule { }
