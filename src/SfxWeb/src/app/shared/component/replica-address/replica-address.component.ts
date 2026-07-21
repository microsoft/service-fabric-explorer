import { Component, OnInit, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-replica-address',
    templateUrl: './replica-address.component.html',
    styleUrls: ['./replica-address.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ReplicaAddressComponent implements OnChanges {

  @Input() address: any;

  isString = false;

  constructor() { }

  ngOnChanges() {
    this.isString = (typeof this.address === 'string');
  }

}
