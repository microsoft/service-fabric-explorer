import { Component, Input } from '@angular/core';

@Component({
  selector: 'node-properties',
  templateUrl: './nodeProperties.component.html',
  styleUrls: ['./nodeProperties.component.scss']
})
export class NodeProperties {
  @Input() properties; // initial prop
  current_properties;
  @Input() numShowedValues = 3; 
  current_index;
  search_query = "";

  constructor() {
    this.current_index = this.numShowedValues;
  }

  ngOnInit() {
    this.current_properties = Object.entries(this.properties);      
  }

  NumShowedValues() {
    return this.numShowedValues;
  }

  showMoreOrLess() {
    if (this.current_index >= this.current_properties.length) this.current_index = this.numShowedValues;  
    else this.current_index += this.numShowedValues;
  }

  search() {
    this.current_properties = [];
    for (let [key,value] of Object.entries(this.properties)) {
      if (key.toLowerCase().includes(this.search_query.toLowerCase())) this.current_properties.push([key,value]);
    }
    this.current_index = this.numShowedValues;
  }

  reset() {
    this.search_query="";
    this.search();
  }
  
}