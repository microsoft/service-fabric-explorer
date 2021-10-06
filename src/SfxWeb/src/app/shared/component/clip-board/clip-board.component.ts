import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, OnInit, Input, ChangeDetectionStrategy, ViewChild, ElementRef, ContentChild } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-clip-board',
  templateUrl: './clip-board.component.html',
  styleUrls: ['./clip-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClipBoardComponent {

  @Input() text = '';
  @ViewChild('ref') ref: ElementRef;
  @ViewChild(NgbTooltip) tooltip: NgbTooltip; // First

  constructor(private liveAnnouncer: LiveAnnouncer) { }

  copy(){
    console.log(this)
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.text;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);

    this.tooltip.close();
    setTimeout(() => {
      this.tooltip.ngbTooltip = "copied!"
      this.tooltip.autoClose = false;
      this.tooltip.triggers = "manual";
      this.tooltip.closeDelay = 2000;
      this.tooltip.open();
      this.tooltip.ngbTooltip = "copy to clipboard";
      this.liveAnnouncer.announce("Copied to clipboard")
    }, 250)

    this.ref.nativeElement.focus()

  }
}
