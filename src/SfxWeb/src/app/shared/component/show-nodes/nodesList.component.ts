import { Component, Input, SimpleChanges } from '@angular/core';
import { OnChanges } from '@angular/core';

@Component({
  selector: 'nodes-list',
  templateUrl: './nodesList.component.html',
  styleUrls: ['./nodesList.component.scss']
})
export class NodesList implements OnChanges {
  @Input() title;
  @Input() nodes:any[];
  @Input() nodesProperty:any[];
  @Input() titleColor:string;
  original_nodes:any[];

  private static readonly page_size=4;
  page = 1;
  start_index;
  end_index; // for pagging

  search_query="";

  constructor() {
    this.start_index = 0;
    this.end_index = NodesList.page_size;
  }

  ngOnChanges(changes: SimpleChanges): void {
      this.original_nodes = changes.nodes.currentValue; 
  }

  ngOnInit() {
    this.original_nodes = this.nodes;
  }

  
  PageSize() {return NodesList.page_size;}

  onChangePage(page) {
    this.page = page;
    this.start_index = (page - 1) * NodesList.page_size;
    this.end_index = this.start_index + NodesList.page_size;
    if (this.end_index > this.nodes.length) this.end_index = this.nodes.length;
  }


  searchNodes() {
    this.nodes = [];
    this.original_nodes.forEach(element => {
      if (element.name.toLowerCase().includes(this.search_query.toLowerCase())) this.nodes.push(element)
    });
  }
  
  reset() {
    this.search_query="";
    this.start_index = 0;
    this.end_index = NodesList.page_size;
    this.searchNodes();
  }

}