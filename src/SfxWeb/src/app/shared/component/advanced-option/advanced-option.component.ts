import { Component, OnInit, ViewChild } from '@angular/core';
import { StorageService } from 'src/app/services/storage.service';
import { Constants } from 'src/app/Common/Constants';
import { MessageService } from 'src/app/services/message.service';
import { SettingsService } from 'src/app/services/settings.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { Platform } from '@angular/cdk/platform';
import { Utils } from 'src/app/Utils/Utils';

@Component({
  selector: 'app-advanced-option',
  templateUrl: './advanced-option.component.html',
  styleUrls: ['./advanced-option.component.scss']
})
export class AdvancedOptionComponent implements OnInit {

  status = false;
  @ViewChild(NgbDropdown, {static: true}) dropdown: NgbDropdown;

  constructor(public storage: StorageService,
              public messageService: MessageService,
              public settingsService: SettingsService,
              private liveAnnouncer: LiveAnnouncer,
              public platform: Platform) { }

  ngOnInit() {
    this.status = this.storage.getValueBoolean(Constants.AdvancedModeKey, false);
  }

  change() {
    this.storage.setValue(Constants.AdvancedModeKey, this.status);
  }

  closeChange(state: boolean) {
    if (!Utils.isIEOrEdge) {
      this.liveAnnouncer.announce(`Settings dropdown button is now ${state ? 'Expanded' : 'Collapsed'}`);
    }
  }
}
