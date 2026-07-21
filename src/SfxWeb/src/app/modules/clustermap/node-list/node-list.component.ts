import { Component, Input, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { Node } from 'src/app/Models/DataModels/Node';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-node-list',
    templateUrl: './node-list.component.html',
    styleUrls: ['./node-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class NodeListComponent {
  @Input() listTemplate: TemplateRef<any>;

  @Input() underlineLast = true;
  @Input() nodes: Node[];

  public assetBase = environment.assetBase;

  constructor() { }

  trackByFn(index, node: Node) {
    return node.uniqueId;
  }
}
