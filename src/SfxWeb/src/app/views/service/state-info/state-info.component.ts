import { Component, Input, OnInit } from '@angular/core';
import { Service } from 'src/app/Models/DataModels/Service';
import { IRawServiceDescription } from 'src/app/Models/RawDataTypes';

@Component({
  selector: 'app-state-info',
  templateUrl: './state-info.component.html',
  styleUrls: ['./state-info.component.scss']
})
export class StateInfoComponent implements OnInit {

  @Input() service: Service;

  constructor() { }

  ngOnInit(): void {
  }

}
