// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-toggle',
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.scss']
})
export class ToggleComponent {
  @Input() aria = '';
  @Input() color: string = "var(--accent-darkblue)";
  @Input() state = false;
  @Output() stateChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor() { }

  changeState() {
    this.stateChange.emit(this.state);
  }

}
