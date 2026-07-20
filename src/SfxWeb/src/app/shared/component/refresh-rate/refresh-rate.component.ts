import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, OnInit, Output, EventEmitter, Input, inject } from '@angular/core';

@Component({
    selector: 'app-refresh-rate',
    templateUrl: './refresh-rate.component.html',
    styleUrls: ['./refresh-rate.component.scss'],
    standalone: false
})
export class RefreshRateComponent {
  private liveAnnouncer = inject(LiveAnnouncer);

  @Input() refresh = false;
  @Input()
  set value( val: number) {
    this.change( +(Object.keys(this.mapping).find(key => this.mapping[key] === val) || 4), false );
  }

  @Input() condensedVersion = false;

  @Output() rateChange = new EventEmitter<string>();
  @Output() forceRefreshed = new EventEmitter<any>();
  refreshRate = 0;

  displayRate: string | number;

  private mapping: Record<number, string> = {
    0: '0',
    1: '300',
    2: '60',
    3: '30',
    4: '10',
    5: '5',
  };

  changed() {
    this.change(this.refreshRate);
  }

  change(updatedValue: number, emitValue = true) {
    this.displayRate = this.mapping[updatedValue];
    this.refreshRate = updatedValue;

    if (emitValue){
      this.rateChange.emit(this.displayRate);
    }

    this.liveAnnouncer.announce(`The refresh rate is ${this.displayRate}`)
  }

  forceRefresh() {
    this.forceRefreshed.emit();
  }
}
