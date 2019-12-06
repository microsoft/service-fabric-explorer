import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-refresh-rate',
  templateUrl: './refresh-rate.component.html',
  styleUrls: ['./refresh-rate.component.scss']
})
export class RefreshRateComponent implements OnInit {

  refreshRate: number = 0;

  displayRate: string;

  _mapping: Record<number, string> = {
    0: "",
    1: "300",
    2: "60",
    3: "30",
    4: "10",
    5: "5",
    6: "2"
  }

  change(updatedValue: number) {
    this.displayRate = this._mapping[updatedValue];
    this.refreshRate = updatedValue;
  }


  constructor() { }

  ngOnInit() {
    this.change(0);
  }

}
