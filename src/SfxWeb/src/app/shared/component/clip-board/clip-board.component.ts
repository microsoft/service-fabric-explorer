import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnInit, Input, ChangeDetectionStrategy, ViewChild, ElementRef, ContentChild, OnChanges } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-clip-board',
  templateUrl: './clip-board.component.html',
  styleUrls: ['./clip-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClipBoardComponent implements OnChanges {

  @Input() text = '';
  @ViewChild('ref') ref: ElementRef;
  @ViewChild(NgbTooltip) tooltip: NgbTooltip; // First
  public ariaLabel = '';

  constructor(private liveAnnouncer: LiveAnnouncer,
              private clipboard: Clipboard) { }

  copy(){
    this.clipboard.copy(this.text)

    this.tooltip.close();
    setTimeout(() => {
      this.tooltip.ngbTooltip = 'copied!';
      this.tooltip.autoClose = false;
      this.tooltip.triggers = 'manual';
      this.tooltip.closeDelay = 2000;
      this.tooltip.open();
      this.tooltip.ngbTooltip = 'copy to clipboard';
      this.liveAnnouncer.announce('Copied to clipboard');
    }, 250);

    this.ref.nativeElement.focus();
  }

  ngOnChanges() {
    if (this.text) {
      this.ariaLabel = this.text.split(' ').join('-');
    }
  }
}
