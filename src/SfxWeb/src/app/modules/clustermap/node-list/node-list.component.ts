import { Component, Input, TemplateRef } from '@angular/core';
import { Node } from 'src/app/Models/DataModels/Node';

@Component({
  selector: 'app-node-list',
  templateUrl: './node-list.component.html',
  styleUrls: ['./node-list.component.scss']
})
export class NodeListComponent {
  @Input() listTemplate: TemplateRef<any>;

  @Input() underlineLast = true;
  @Input() nodes: Node[];

  constructor() { }

  trackByFn(index, node: Node) {
    return node.uniqueId;
  }
}
