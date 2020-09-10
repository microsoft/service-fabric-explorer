import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-refresh-rate',
  templateUrl: './refresh-rate.component.html',
  styleUrls: ['./refresh-rate.component.scss']
})
export class RefreshRateComponent {
  @Input() refresh = false;
  @Input()
  set value( val: number) {
    this.change( +(Object.keys(this._mapping).find(key => this._mapping[key] === val) || 4), false );
  }

  @Output() onChange = new EventEmitter<string>();
  @Output() onForceRefresh = new EventEmitter<any>();
  refreshRate = 0;

  displayRate: string | number;

  _mapping: Record<number, string> = {
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
    this.displayRate = this._mapping[updatedValue];
    this.refreshRate = updatedValue;

    if (emitValue){
      this.onChange.emit(this.displayRate);
    }
  }

  forceRefresh() {
    this.onForceRefresh.emit();
  }


  constructor() { }

}
