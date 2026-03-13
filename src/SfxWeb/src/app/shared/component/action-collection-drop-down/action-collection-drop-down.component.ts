// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { ActionCollection } from 'src/app/Models/ActionCollection';
import { DataService } from 'src/app/services/data.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Utils } from 'src/app/Utils/Utils';

@Component({
  selector: 'app-action-collection-drop-down',
  templateUrl: './action-collection-drop-down.component.html',
  styleUrls: ['./action-collection-drop-down.component.scss']
})
export class ActionCollectionDropDownComponent {
  @Input() treeView = false;
  @Input() actionCollection: ActionCollection;
  @Input() displayText: string;
  @Input() tabindex = 0;
  @Output() changedState = new EventEmitter();
  @Output() actionFocus = new EventEmitter();
  @Output() actionBlur = new EventEmitter();
  constructor(public dataService: DataService, private liveAnnouncer: LiveAnnouncer) { }

  closeChange(state: boolean) {
    if (!Utils.isIEOrEdge) {
      this.liveAnnouncer.announce(`Actions dropdown button is now ${state ? 'Expanded' : 'Collapsed'}`);
    }

    this.changedState.emit(state);
  }

  emitFocus() {
    this.actionFocus.emit();
  }

  emitBlur() {
    this.actionBlur.emit();
  }
}
