import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnInit, Input, ChangeDetectionStrategy, ViewChild, ElementRef, ContentChild, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from './confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-clip-board',
  templateUrl: './clip-board.component.html',
  styleUrls: ['./clip-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClipBoardComponent implements OnChanges {

  @Input() text = '';
  @Input() tooltipText = '';
  @Input() disabled = false;
  @Input() confirmationText = '';
  @ViewChild('ref') ref: ElementRef;
  @ViewChild(NgbTooltip) tooltip: NgbTooltip; // First
  public ariaLabel = '';

  constructor(private liveAnnouncer: LiveAnnouncer,
              private clipboard: Clipboard,
              private dialog: MatDialog) { }
              

  checkConfirmation() {
    if (this.confirmationText) {
      this.dialog.open(ConfirmationModalComponent, { data: { text: this.confirmationText} } );
      this.tooltip.close();
    }
    else {
      this.copy();
    }
  }
  copy() {
    
    
    this.clipboard.copy(this.text)

    this.tooltip.close();
    setTimeout(() => {
      this.tooltip.ngbTooltip = 'copied!';
      this.tooltip.autoClose = false;
      this.tooltip.triggers = 'manual';
      this.tooltip.closeDelay = 2000;
      this.tooltip.open();
      this.tooltip.ngbTooltip = this.tooltipText ? this.tooltipText : 'copy to clipboard';
      this.liveAnnouncer.announce('Copied to clipboard');
    }, 250);

    this.ref.nativeElement.focus();
  }

  ngOnChanges() {
    if (this.text) {
      this.ariaLabel = this.text.toString().split(' ').join('-');
    }
  }
}
