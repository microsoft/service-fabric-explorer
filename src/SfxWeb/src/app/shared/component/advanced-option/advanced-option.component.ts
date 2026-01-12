// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { StorageService } from 'src/app/services/storage.service';
import { Constants, TelemetryEventNames } from 'src/app/Common/Constants';
import { MessageService } from 'src/app/services/message.service';
import { SettingsService } from 'src/app/services/settings.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { NgbDropdown, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Platform } from '@angular/cdk/platform';
import { Utils } from 'src/app/Utils/Utils';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-advanced-option',
  templateUrl: './advanced-option.component.html',
  styleUrls: ['./advanced-option.component.scss']
})
export class AdvancedOptionComponent implements OnInit {
  public showBeta = environment.showBeta;

  status = false;
  @ViewChild(NgbDropdown, {static: true}) dropdown: NgbDropdown;
  @ViewChildren(NgbTooltip) tooltips: QueryList<NgbTooltip>;

  constructor(public storage: StorageService,
              public messageService: MessageService,
              public settingsService: SettingsService,
              private liveAnnouncer: LiveAnnouncer,
              public platform: Platform,
              public telemetryService: TelemetryService,
              private elRef: ElementRef) { }

  ngOnInit() {
    this.status = this.storage.getValueBoolean(Constants.AdvancedModeKey, false);
  }

  change() {
    this.storage.setValue(Constants.AdvancedModeKey, this.status);
    this.telemetryService.trackActionEvent(TelemetryEventNames.advancedMode, null, TelemetryEventNames.advancedMode);
  }

  closeChange(state: boolean) {
    if (!Utils.isIEOrEdge) {
      this.liveAnnouncer.announce(`Settings dropdown button is now ${state ? 'Expanded' : 'Collapsed'}`);
    }
  }

  @HostListener("document:click", ["$event"])
  handleClickEvent(event: PointerEvent) {
    try {
      if(this.dropdown.isOpen() && !event.target['closest']("#advanced-options-container")) {
        this.dropdown.close();
      }
    } catch(e) {
      console.log(e)
    }
  }

  @HostListener("document:keyup", ["$event"])
  handleEscapeKey(event: KeyboardEvent) {
    try {
      if (event.key == "Escape") {
        if (this.dropdown.isOpen() && this.tooltips.toArray().every(tooltip => !tooltip.isOpen())) {
          this.dropdown.close();
        }
      }
    } catch(e) {
      console.log(e)
    }
  }

  pageSize(size) {
    this.settingsService.paginationLimit = size;
    this.telemetryService.trackActionEvent(TelemetryEventNames.listSize, {value: size.toString()});
  }

  suppressMessages(state) {
    this.messageService.suppressMessage = state;
    this.telemetryService.trackActionEvent(TelemetryEventNames.supressMessage, null, TelemetryEventNames.supressMessage);
  }

  telemetryChange() {
    this.telemetryService.SetTelemetry(this.telemetryService.telemetryEnabled);
  }

  leaveBeta() {
    const originalUrl =  location.href.replace('index.html', 'old.html');
    window.location.assign(originalUrl);
  }
}
