import { Component, OnInit, OnChanges, AfterViewInit, Input } from '@angular/core';
import { IConcurrentEvents } from '../../event-store/event-store/event-store.component';
import * as Highcharts from 'highcharts';
import { Options } from 'highcharts';

import HighchartsSankey from "highcharts/modules/sankey";
import HighchartsOrganization from "highcharts/modules/organization";
import HighchartsExporting from "highcharts/modules/exporting";
import { ConcurrentEventsVisualizationModule } from '../concurrent-events-visualization.module';

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

  public options: Options = {
      chart: {
        height: 1000,
        inverted: true,
        backgroundColor: null
      },
      title: {
        text: 'Concurrent Events Visualization Tool',
        style: {
          color: 'white',
          fontSize: '15px'
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
        fontSize: '10px'
      },
      borderColor: 'white',
      nodeWidth: 120
    }
    // perform BFS to convert to organization chart
    let queue = [];
    if (this.simulEvents) {
      queue = [...this.simulEvents];        

      let levels = 0;      
      let fontPrefix = "<p style='font-size: 12px; color: white;'>"
      while (queue.length > 0) {
          let currSize = queue.length;                    
          for (let i = 0; i < currSize; i++) {
              let currEvent = queue.shift();
              let newNodeComponent = {
                  id: fontPrefix + currEvent.id + "</p>",
                  title: currEvent.kind,
                  layout: "hanging",                                    
              }                          

              // root node should not be hanging - this messes up the diagram
              if (currSize == 1) {
                  delete newNodeComponent["layout"];
              }
              config.nodes.push(newNodeComponent);

              if (currEvent.related) {
                  currEvent.related.forEach(relatedEvent => {
                      config.data.push([`${fontPrefix}${currEvent.id}</p>`, `${fontPrefix}${relatedEvent.id}</p>`]);
                      queue.push(relatedEvent);
                  });
              }
          }  
          levels++;
      }      

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