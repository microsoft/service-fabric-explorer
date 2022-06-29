import { Component, OnInit, OnChanges, AfterViewInit, Input } from '@angular/core';
import { IConcurrentEvents } from '../../event-store/event-store/event-store.component';
import * as Highcharts from 'highcharts';
import { Options } from 'highcharts';

import HighchartsSankey from "highcharts/modules/sankey";
import HighchartsOrganization from "highcharts/modules/organization";
import HighchartsExporting from "highcharts/modules/exporting";

HighchartsSankey(Highcharts);
HighchartsOrganization(Highcharts);
HighchartsExporting(Highcharts);

@Component({
  selector: 'app-visualization-tool',
  templateUrl: './visualization-tool.component.html',
  styleUrls: ['./visualization-tool.component.scss']
})

export class VisualizationToolComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() simulEvents : IConcurrentEvents[]

  private minNodeHeight: number = 200;
  private nameSizePx: number = 20;
  private kindSizePx: number = 15;
  private titleSizePx: number = 30;

  public options: Options = {
      chart: {
        height: 0,
        inverted: true,
        backgroundColor: null
      },
      title: {
        text: 'Concurrent Events Visualization Tool',
        style: {
          color: 'white',
          fontSize: `${this.titleSizePx}px`
        }
      },
      series: [],
      tooltip: {
        outside: true
      },
      exporting: {
        allowHTML: true,
        sourceWidth: 800,
        sourceHeight: 600
      }
  }

  constructor() {
  }

  ngOnInit() {
    console.log("Visualization Tool Created!");
  }

  ngAfterViewInit(): void {
    this.options.series = [this.traverse()];    
    Highcharts.chart('container', this.options);
  }

  traverse(): any {
    let config = {
      type: 'organization',
      name: 'Highsoft',
      keys: ['from', 'to'],
      data: [],
      levels: [],
      nodes: [],
      colorByPoint: false,
      dataLabels: {
        color: 'white',
        fontSize: '20px'
      },
      borderColor: 'white',
      nodeWidth: this.minNodeHeight
    }
    // perform BFS to convert to organization chart
    let queue = [];
    if (this.simulEvents) {
      queue = [...this.simulEvents];        

      let levels = 0;      
      let fontPrefix = `<p style='font-size: ${this.nameSizePx}px; color: white;'>`
      let titlePrefix = `<p style='font-size: ${this.kindSizePx}px; color: white;'>`
      while (queue.length > 0) {
          let currSize = queue.length;
          for (let i = 0; i < currSize; i++) {
              let currEvent = queue.shift();
              let action = currEvent.reasonForEvent ? currEvent.reasonForEvent : "";
              let newNodeComponent = {
                  id: fontPrefix + currEvent.eventInstanceId + "</p>",
                  title: titlePrefix + action + currEvent.kind + "</p>",
                  layout: "hanging",                                    
              }                          

              // root node should not be hanging - this messes up the diagram
              if (currSize == 1) {
                  delete newNodeComponent["layout"];
              }
              config.nodes.push(newNodeComponent);

              if (currEvent.related) {
                  currEvent.related.forEach(relatedEvent => {
                      config.data.push([`${fontPrefix}${currEvent.eventInstanceId}</p>`, `${fontPrefix}${relatedEvent.eventInstanceId}</p>`]);
                      queue.push(relatedEvent);
                  });
              }
          }  
          levels++;
      }    
      
      this.options.chart.height = this.minNodeHeight * (levels + 1);

      let colors = ["#8F0600", "#2E8100", "#6C007F", "#1A386D"];
      for (let i = 0; i < levels; i++) {        
          let newLevelComponent = {
              level: i,
              color: colors[i]
          }
          config.levels.push(newLevelComponent);
      }
    }
    return config;
  }

  ngOnChanges(): void {    
    this.options.series = [this.traverse()];
    Highcharts.chart('container', this.options);
  }
}