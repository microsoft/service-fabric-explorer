import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { HealthStateConstants } from 'src/app/Common/Constants';
import { Node } from 'src/app/Models/DataModels/Node';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-node-filter',
  templateUrl: './node-filter.component.html',
  styleUrls: ['./node-filter.component.scss']
})
export class NodeFilterComponent implements OnInit, OnChanges {

  @Input() showGroupByNodeType = true;

  @Input() nodes: Node[];
  @Input() groupByNodeType = false;
  @Output() groupByNodeTypeChange = new EventEmitter();

  @Output() filteredNodes = new EventEmitter<Node[]>();

  filter = '';
  healthFilter: Record<string, boolean> = {};
  nodeTypeFilter: Record<string, boolean> = {};

  constructor(public data: DataService) { }

  ngOnInit(): void {
    this.healthFilter[HealthStateConstants.OK] = true;
    this.healthFilter[HealthStateConstants.Warning] = true;
    this.healthFilter[HealthStateConstants.Error] = true;

    this.data.nodes.ensureInitialized().subscribe(() => {
      this.data.nodes.nodeTypes.forEach(type => {
        if (!(type in this.nodeTypeFilter)) {
          this.nodeTypeFilter[type] = true;
        }
      });
    });
  }

  ngOnChanges() {
    if (!this.nodes) {
      this.data.nodes.ensureInitialized().subscribe(() => {
        this.nodes = this.data.nodes.collection;
        this.updateNodes();
      });
    }else{
      this.updateNodes();
    }
  }

  public getNodesForDomains(): Node[] {
    return this.nodes.filter((node) => (node.raw.Type in this.nodeTypeFilter ? this.nodeTypeFilter[node.raw.Type] : true) &&
      (this.filter.length > 0 ? node.name.toLowerCase().includes(this.filter) : true) &&
      (node.healthState.badgeId in this.healthFilter ? this.healthFilter[node.healthState.badgeId] : true));
  }

  public updateNodes() {
    this.filteredNodes.emit(this.getNodesForDomains());
    this.groupByNodeTypeChange.emit(this.groupByNodeType);
  }
}
