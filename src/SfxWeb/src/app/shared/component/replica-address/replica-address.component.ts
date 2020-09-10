import { Component, OnInit, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-replica-address',
  templateUrl: './replica-address.component.html',
  styleUrls: ['./replica-address.component.scss']
})
export class ReplicaAddressComponent implements OnChanges {

  @Input() address: any;

  isString = false;

  constructor() { }

  ngOnChanges() {
    this.isString = (typeof this.address === 'string');
  }

}
