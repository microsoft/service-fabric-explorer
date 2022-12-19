import { Component, OnInit, OnChanges, AfterViewInit, Input, ViewChild, ElementRef } from '@angular/core';
import { EventStoreComponent } from '../../event-store/event-store/event-store.component';
import * as Highcharts from 'highcharts';
import { chart, Chart, Options, SeriesOptionsType, SeriesSankeyNodesOptionsObject } from 'highcharts';
import HighchartsSankey from "highcharts/modules/sankey";
import HighchartsOrganization from "highcharts/modules/organization";
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { IConcurrentEvents, IRCAItem } from 'src/app/Models/eventstore/rcaEngine';

HighchartsSankey(Highcharts);
HighchartsOrganization(Highcharts);

export interface IEventStoreRef extends ListColumnSetting {
  eventStoreRef: EventStoreComponent;
}



@Component({
  selector: 'app-visualization-tool',
  templateUrl: './visualization-tool.component.html',
  styleUrls: ['./visualization-tool.component.scss']
})

export class VisualizationToolComponent implements OnChanges, AfterViewInit, DetailBaseComponent {
  private nameSizePx: number = 10;
  private kindSizePx: number = 10;
  private titleSizePx: number = 20;
  private chart: Chart;

  visEvents : IConcurrentEvents;
  item : IRCAItem;
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
        animation: false,
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
        enabled: false

      },
      plotOptions: {
        series: {
          animation: false
        }
      },
      credits: {
        enabled: false
      }
  }

  constructor() {
  }

  ngAfterViewInit(): void {
    this.visEvents = this.listSetting.eventStoreRef.simulEvents.find(
      visEvent => visEvent.eventInstanceId == this.item.eventInstanceId);
    this.options.series = [this.traverse()];
    const data = this.traverse();
    this.options.chart.height = data.levels.length * 110;
    this.chart = chart(this.container.nativeElement, this.options);
  }

  traverse() {
    let config : SeriesOptionsType = {
      type: 'organization',
      name: '',
      keys: ['from', 'to'],
      data: [],
      levels: [],
      nodes: [],
      colorByPoint: false,
      borderColor: 'transparent',
      hangingIndent: 0,
    }
    // perform BFS to convert to organization chart
    let queue: IConcurrentEvents[] = [];
    if (this.visEvents) {
      queue = [this.visEvents];

      let levels = 0;
      let fontPrefix = `<p style='font-size: ${this.nameSizePx}px; color: white;'>`
      let titlePrefix = `<p style='font-size: ${this.kindSizePx}px; color: white;'>`
      let maxHeight = 0;
      while (queue.length > 0) {
          let currSize = queue.length;
          maxHeight = Math.max(currSize, maxHeight);
          for (let i = 0; i < currSize; i++) {
              let currEvent = queue.shift();
              let action = currEvent.reasonForEvent ? "Reason: " + currEvent.reasonForEvent + "</br>" : "";
              let newNodeComponent : SeriesSankeyNodesOptionsObject = {
                  id: fontPrefix + currEvent.eventInstanceId + "</p>",
                  title: titlePrefix + action + currEvent.kind + "</p>",
                  layout: "hanging",
                  height: 80,
                  opacity: 1,
                  dataLabels: {
                    enabled: true,
                    className: 'inner-tooltip'
                  }
              } as any;

              // root node should not be hanging - this messes up the diagram
              if (currSize == 1) {
                  delete newNodeComponent["layout"];
              }
              config.nodes.push(newNodeComponent);

              if (currEvent.reason) {
                if (currEvent.reason.name == "self") {
                  config.data.push({
                    from: `${fontPrefix}${currEvent.eventInstanceId}</p>`,
                    to: `${fontPrefix}${currEvent.eventInstanceId}</p>`
                  });
                } else {
                  config.data.push({
                    from: `${fontPrefix}${currEvent.eventInstanceId}</p>`,
                    to: `${fontPrefix}${currEvent.reason.eventInstanceId}</p>`
                  });
                  queue.push(currEvent.reason);
                }
              }
          }
          levels++;
      }

      for (let i = 0; i < levels; i++) {
          let newLevelComponent = {
              level: i,
              color: null,
          }
          config.levels.push(newLevelComponent);
      }
    }
    return config;
  }

  ngOnChanges(): void {
    if (this.chart) {
      const data = this.traverse();
      this.chart.series[0].update(data);
      this.chart.setSize(undefined, data.levels.length * 100);
    }
  }
}
