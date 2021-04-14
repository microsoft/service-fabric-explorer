import { Component, OnInit, Input } from '@angular/core';
import { Node } from 'src/app/Models/DataModels/Node';

@Component({
  selector: 'app-node-deactivation-info',
  templateUrl: './node-deactivation-info.component.html',
  styleUrls: ['./node-deactivation-info.component.scss']
})
export class NodeDeactivationInfoComponent implements OnInit {

  @Input() node: Node;

  constructor() { }

  ngOnInit(): void {
  }

}
