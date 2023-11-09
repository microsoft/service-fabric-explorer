import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './component/navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClipBoardComponent } from './component/clip-board/clip-board.component';
import { HealthBadgeComponent } from './component/health-badge/health-badge.component';
import { CandyBarCompactComponent } from './component/candy-bar-compact/candy-bar-compact.component';
import { DetailViewPartComponent } from './component/detail-view-part/detail-view-part.component';
import { CollapseContainerComponent } from './component/collapse-container/collapse-container.component';
import { RefreshRateComponent } from './component/refresh-rate/refresh-rate.component';
import { DragDirective } from './directive/drag.directive';
import { ManifestComponent } from './component/manifest/manifest.component';
import { ActionCollectionDropDownComponent } from './component/action-collection-drop-down/action-collection-drop-down.component';
import { NgbDropdownModule, NgbToastModule, NgbDatepickerModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { InputComponent } from './component/input/input.component';
import { ToastContainerComponent } from './component/toast-container/toast-container.component';
import { CheckBoxComponent } from './component/check-box/check-box.component';
import { ClusterUpgradeBannerComponent } from './component/cluster-upgrade-banner/cluster-upgrade-banner.component';
import { DualDatePickerComponent } from './component/dual-date-picker/dual-date-picker.component';
import { AdvancedOptionComponent } from './component/advanced-option/advanced-option.component';
import { ReplicaAddressComponent } from './component/replica-address/replica-address.component';
import { FormatDatePipe } from './pipes/format-date.pipe';
import { LocalTimeComponent } from './component/local-time/local-time.component';
import { DisplayTimeComponent } from './component/display-time/display-time.component';
import { ToggleComponent } from './component/toggle/toggle.component';
import { StatusResolverComponent } from './component/status-resolver/status-resolver.component';
import { StateInfoComponent } from './component/state-info/state-info.component';
import { EssentialItemComponent } from './component/essential-item/essential-item.component';
import { DisplayDurationComponent } from './component/display-duration/display-duration.component';
import { PhaseDiagramComponent } from './component/phase-diagram/phase-diagram.component';
import { NodeFilterComponent } from './component/node-filter/node-filter.component';
import {ClipboardModule} from '@angular/cdk/clipboard';

import { WarningComponent } from './component/warning/warning.component';
import { EventStoreTimelineComponent } from './component/event-store-timeline/event-store-timeline.component';
import { FocusableDirective } from './directive/focusable.directive';
import { ArmWarningComponent } from './component/arm-warning/arm-warning.component';

@NgModule({
  declarations: [NavbarComponent, ClipBoardComponent, HealthBadgeComponent, CandyBarCompactComponent, DetailViewPartComponent,
                 CollapseContainerComponent, RefreshRateComponent, DragDirective, ManifestComponent,
                 ActionCollectionDropDownComponent, InputComponent, ToastContainerComponent, CheckBoxComponent,
                 ClusterUpgradeBannerComponent, DualDatePickerComponent, AdvancedOptionComponent, ReplicaAddressComponent,
                 FormatDatePipe, LocalTimeComponent, DisplayTimeComponent, ToggleComponent, StatusResolverComponent,
                 StateInfoComponent,
                 EssentialItemComponent,
                 DisplayDurationComponent,
                 PhaseDiagramComponent,
                 NodeFilterComponent,
                 WarningComponent, EventStoreTimelineComponent, FocusableDirective, ArmWarningComponent],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NgbDropdownModule,
    NgbToastModule,
    NgbDatepickerModule,
    NgbTooltipModule,
    ClipboardModule
  ],
  exports: [NavbarComponent, ClipBoardComponent, HealthBadgeComponent, CandyBarCompactComponent, DetailViewPartComponent,
            CollapseContainerComponent, RefreshRateComponent, DragDirective, ManifestComponent,
            ActionCollectionDropDownComponent, InputComponent, ToastContainerComponent, CheckBoxComponent,
            ClusterUpgradeBannerComponent, DualDatePickerComponent, AdvancedOptionComponent, ReplicaAddressComponent,
            FormatDatePipe, LocalTimeComponent, DisplayTimeComponent, ToggleComponent, StatusResolverComponent,
            StateInfoComponent, EssentialItemComponent, DisplayDurationComponent, PhaseDiagramComponent, NodeFilterComponent,
            WarningComponent, EventStoreTimelineComponent, ArmWarningComponent]
})
export class SharedModule { }
