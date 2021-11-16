import { Component, Input, OnInit } from '@angular/core';
import { Node } from 'src/app/Models/DataModels/Node';

@Component({
  selector: 'app-node-list',
  templateUrl: './node-list.component.html',
  styleUrls: ['./node-list.component.scss']
})
export class NodeListComponent implements OnInit {
  @Input() underlineLast = true;
  @Input() nodes: Node[];

  constructor() { }

  ngOnInit(): void {
  }

}
