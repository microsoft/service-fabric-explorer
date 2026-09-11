import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, OnChanges, OnDestroy, inject } from '@angular/core';
import { ExperienceService } from 'src/app/services/experience.service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-clip-board',
    templateUrl: './clip-board.component.html',
    styleUrls: ['./clip-board.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ClipBoardComponent implements OnChanges, OnDestroy {
  public experience = inject(ExperienceService);
  private cdr = inject(ChangeDetectorRef);
  public copyState: 'idle' | 'copied' | 'failed' = 'idle';
  private resetTimer?: ReturnType<typeof setTimeout>;
  private liveAnnouncer = inject(LiveAnnouncer);
  private clipboard = inject(Clipboard);


  @Input() text = '';
  @Input() tooltipText = '';
  @Input() disabled = false;
  @Input() name = '';
  @ViewChild('ref') ref!: ElementRef;
  @ViewChild(NgbTooltip) tooltip!: NgbTooltip; // First
  public ariaLabel = '';
              
  copy() {
    if (this.disabled) { return; }
    if (this.experience.isNew()) {
      clearTimeout(this.resetTimer);
      const success = this.clipboard.copy(String(this.text ?? ''));
      this.copyState = success ? 'copied' : 'failed';
      this.liveAnnouncer.announce(success ? 'Copied to clipboard' : 'Copy failed. Please select and copy the text manually.');
      this.ref.nativeElement.focus({ preventScroll: true });
      this.resetTimer = setTimeout(() => { this.copyState = 'idle'; this.cdr.markForCheck(); }, 2000);
      return;
    }
    
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
    clearTimeout(this.resetTimer);
    this.copyState = 'idle';
    if (this.text) {
      this.ariaLabel = this.text.toString().split(' ').join('-');
    }
  }
  ngOnDestroy() { clearTimeout(this.resetTimer); }
}
