import { Component, OnInit, OnChanges, AfterViewInit, Input, ViewChild, ElementRef } from '@angular/core';
import { EventStoreComponent, IConcurrentEvents } from '../../event-store/event-store/event-store.component';
import * as Highcharts from 'highcharts';
import { chart, Chart, Options, SeriesOptionsType, SeriesSankeyNodesOptionsObject } from 'highcharts';

import HighchartsSankey from "highcharts/modules/sankey";
import HighchartsOrganization from "highcharts/modules/organization";
import HighchartsExporting from "highcharts/modules/exporting";
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { NodeEvent } from 'src/app/Models/eventstore/Events';

HighchartsSankey(Highcharts);
HighchartsOrganization(Highcharts);
HighchartsExporting(Highcharts);

export interface IEventStoreRef extends ListColumnSetting {
  eventStoreRef: EventStoreComponent;
}

export interface IItemNodeEvent {
  visEvents?: IConcurrentEvents;
  raw: NodeEvent;
}

@Component({
  selector: 'app-visualization-tool',
  templateUrl: './visualization-tool.component.html',
  styleUrls: ['./visualization-tool.component.scss']
})

export class VisualizationToolComponent implements OnInit, OnChanges, AfterViewInit, DetailBaseComponent {
  private nameSizePx: number = 10;
  private kindSizePx: number = 10;
  private titleSizePx: number = 20;
  private chart: Chart;

  item : IItemNodeEvent;
  listSetting : IEventStoreRef;

  @ViewChild('container') private container: ElementRef;

  public options: Options = {
      chart: {
        inverted: true,
        backgroundColor: null,
        margin: [0, 0, 0, 0],
        spacingTop: 0,
        spacingBottom: 0,
        spacingLeft: 0,
        spacingRight: 0,
      },
      title: {
        text: '',
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
        sourceWidth: 600,
        sourceHeight: 800,
      }
  }

  constructor() {
  }

  ngOnInit() {
    console.log("Visualization Tool Created!");
  }

  ngAfterViewInit(): void {
    this.grabVisEvents();
    this.options.series = [this.traverse()];
    this.chart = chart(this.container.nativeElement, this.options);    
  }

  grabVisEvents() : void {
    for (let visEvent of this.listSetting.eventStoreRef.visEventList) {
      if (visEvent.eventInstanceId == this.item.raw.eventInstanceId) {
        this.item.visEvents = visEvent.visEvent;
        break;
      }
    }
  }

  traverse(): SeriesOptionsType {
    let config : SeriesOptionsType = {
      type: 'organization',
      name: 'Highsoft',
      keys: ['from', 'to'],
      data: [],
      levels: [],
      nodes: [],
      colorByPoint: false,
      dataLabels: {
        color: 'white'
      },
      borderColor: 'white',
    }
    // perform BFS to convert to organization chart
    let queue = [];    
    if (this.item.visEvents) {
      queue = [this.item.visEvents];        

      let levels = 0;      
      let fontPrefix = `<p style='font-size: ${this.nameSizePx}px; color: white;'>`
      let titlePrefix = `<p style='font-size: ${this.kindSizePx}px; color: white;'>`
      let maxHeight = 0;
      while (queue.length > 0) {
          let currSize = queue.length;
          maxHeight = Math.max(currSize, maxHeight);
          for (let i = 0; i < currSize; i++) {
              let currEvent = queue.shift();
              let action = currEvent.reasonForEvent ? currEvent.reasonForEvent : "";
              let newNodeComponent : SeriesSankeyNodesOptionsObject = {
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
                    if (relatedEvent.name == "self") {                      
                      config['data'].push([`${fontPrefix}${currEvent.eventInstanceId}</p>`, `${fontPrefix}${currEvent.eventInstanceId}</p>`]);                    
                    } else {
                      config['data'].push([`${fontPrefix}${currEvent.eventInstanceId}</p>`, `${fontPrefix}${relatedEvent.eventInstanceId}</p>`]);
                      queue.push(relatedEvent);                      
                    }
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
    if (this.chart) {
      this.chart.series[0].update(this.traverse());
    }
  }
}