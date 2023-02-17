import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-arm-warning',
  templateUrl: './arm-warning.component.html',
  styleUrls: ['./arm-warning.component.scss']
})
export class ArmWarningComponent implements OnInit {

  @Input() inputs: {resourceId: string, message?: string, confirmationKeyword?: string};
  constructor() { }

  ngOnInit(): void {
  }

}
