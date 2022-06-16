import { Component, OnInit, Input } from '@angular/core';
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
export class VisualizationToolComponent implements OnInit {
  public options: any = {
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
      accessibility: {
        point: {
          descriptionFormatter: function (point) {
            var nodeName = point.toNode.name,
              nodeId = point.toNode.id,
              nodeDesc = nodeName === nodeId ? nodeName : nodeName + ', ' + nodeId,
              parentDesc = point.fromNode.id;
            return point.index + '. ' + nodeDesc + ', reports to ' + parentDesc + '.';
          }
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

  @Input() simulEvents : IConcurrentEvents[]

  ngOnInit(): void {    
    this.options.series = [this.traverse(this.simulEvents)];
    Highcharts.chart('container', this.options);
  }

  traverse(simulEvents : IConcurrentEvents[]): any {
    let res = {
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
      this.simulEvents.forEach(simulEvent => queue.push(simulEvent));

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

              if (currSize == 1) {
                  delete newNodeComponent["layout"];
              }
              res.nodes.push(newNodeComponent);

              if (currEvent.related) {
                  currEvent.related.forEach(relatedEvent => {
                      res.data.push([fontPrefix + currEvent.id + "</p>", fontPrefix + relatedEvent.id + "</p>"]);
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
          res.levels.push(newLevelComponent);
      }      
      console.log("levels: ", res.levels);
    }
    return res;
  }

  ngOnChanges(): void {    
    let res = this.traverse(this.simulEvents);
    console.log("Res Formatted: ", res);
    console.log("Data: ", JSON.stringify(res.data));
    this.options.series = [this.traverse(this.simulEvents)];
    console.log("Options: ", JSON.stringify(this.options));
    Highcharts.chart('container', this.options);
  }
}