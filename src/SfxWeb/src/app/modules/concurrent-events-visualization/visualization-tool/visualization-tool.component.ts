// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnChanges, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { chart, Chart, Options, SeriesOptionsType, SeriesSankeyNodesOptionsObject } from 'highcharts';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting, ListColumnSettingWithEmbeddedVis } from 'src/app/Models/ListSettings';
import { IConcurrentEvents, IRCAItem } from 'src/app/Models/eventstore/rcaEngine';


@Component({
  selector: 'app-visualization-tool',
  templateUrl: './visualization-tool.component.html',
  styleUrls: ['./visualization-tool.component.scss']
})

export class VisualizationToolComponent implements OnChanges, AfterViewInit, DetailBaseComponent {
  private idSizePx: number = 12;
  private eventTitleSizePx: number = 14;
  private textSizePx: number = 12;
  private titleSizePx: number = 20;

  private idColor: string = "var(--font-placeholder-color)";
  private eventTitleColor: string = "var(--font-primary-color)";
  private textColor: string = "var(--font-accent-color)";

  private chart: Chart;

  visEvents : IConcurrentEvents;
  item : IRCAItem;
  listSetting : ListColumnSettingWithEmbeddedVis;

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

    this.options.series = [this.traverse()];
    const data = this.traverse();
    this.options.chart.height = data.levels.length * 110 || 1;
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
    this.visEvents = this.listSetting.visEvents[this.item.eventInstanceId];
    if (this.visEvents) {
      queue = [this.visEvents];

      let levels = 0;
      let idPrefix = `<p style='font-size: ${this.idSizePx}px; color: ${this.idColor};'> <b>EventInstanceId: </b>`
      let eventTitlePrefix = `<p style='font-size: ${this.eventTitleSizePx}px; color: ${this.eventTitleColor};'>`
      let descriptionPrefix = `<p style='font-size: ${this.textSizePx}px; color: ${this.textColor};'>`
      let maxHeight = 0;
      while (queue.length > 0) {
          let currSize = queue.length;
          maxHeight = Math.max(currSize, maxHeight);
          for (let i = 0; i < currSize; i++) {
              let currEvent = queue.shift();
              let action = currEvent.reasonForEvent ? "<b>Reason: </b>" + currEvent.reasonForEvent + "</br>" : "";
              let timestamp = "<b>Timestamp: </b>" + currEvent.timeStamp;
              let newNodeComponent : SeriesSankeyNodesOptionsObject = {
                  id: idPrefix + currEvent.eventInstanceId + "</p>",
                  title: eventTitlePrefix + currEvent.kind + "</p>",
                  description: descriptionPrefix + action + timestamp +"</p>",
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
                    from: `${idPrefix}${currEvent.eventInstanceId}</p>`
                  });
                } else {
                  config.data.push({
                    to: `${idPrefix}${currEvent.eventInstanceId}</p>`,
                    from: `${idPrefix}${currEvent.reason.eventInstanceId}</p>`
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
