// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, Inject, Input, OnInit } from '@angular/core';
import { DialogBodyComponent } from '../DialogBodyComponent';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IsolatedAction } from 'src/app/Models/Action';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-message-with-wait-confirmation',
  templateUrl: './message-with-wait-confirmation.component.html',
  styleUrls: ['./message-with-wait-confirmation.component.scss']
})
export class MessageWithWaitConfirmationComponent implements OnInit, DialogBodyComponent {
  private readonly countdownTime = 15000;
  private readonly countdownStepInMS = 1000;

  @Input() inputs: any = {};

  colorMap: Record<number, string> = {
    0: 'yellow'
  }

  checked = false;
  countDown = false;
  countDownLeft = this.countdownTime;
  timerSubscription: Subscription;

  constructor(public dialogRef: MatDialogRef<MessageWithWaitConfirmationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IsolatedAction
  ) { }

  ngOnInit(): void {
    this.dialogRef.beforeClosed().subscribe(() => {
      this.cancel();
      console.log('closed');
    });
  }

  confirmed() {
    this.countDownLeft = this.countdownTime;
    this.timerSubscription = timer(0, this.countdownStepInMS).subscribe(() => {
      if(this.countDownLeft > 0) {
        this.countDown = true;
        this.countDownLeft -= this.countdownStepInMS;
      }

      if(this.countDownLeft == 0) {
        this.timerSubscription.unsubscribe();
        this.data.data.callback.subscribe(() => {
          this.dialogRef.close(true);
        },
        () => {
          this.cancel();
        });
      }
    });
  }

  cancel() {
    this.timerSubscription.unsubscribe();
    this.checked = false;
    this.countDown = false;
  }

  close() {
    this.dialogRef.close(false);
  }
}
