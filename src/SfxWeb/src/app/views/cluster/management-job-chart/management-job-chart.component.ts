import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Chart, Options, chart } from 'highcharts';
import { InfrastructureJob } from 'src/app/Models/DataModels/infrastructureJob';
import { ISortOrdering } from 'src/app/modules/detail-list-templates/detail-list/detail-list.component';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { Utils } from 'src/app/Utils/Utils';

@Component({
  selector: 'app-management-job-chart',
  templateUrl: './management-job-chart.component.html',
  styleUrls: ['./management-job-chart.component.scss']
})
export class ManagementJobChartComponent implements OnInit, OnChanges {

  @Input() jobs: InfrastructureJob[];
  @Input() sortOrder: ISortOrdering;

  fontColor = {
    color: '#fff'
  };

  private chart: Chart;

  constructor() { }

  ngOnInit(): void {
    const options: Options = {
      chart: {
        type: 'area',
        zoomType: 'x',
        backgroundColor: '#262626'
      },
      title: {
        text: 'Filter and sort the tables below',
        style: this.fontColor
    },

    subtitle: {
      style: this.fontColor,
      text:  document.ontouchstart === undefined ?
          'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
    },
    yAxis: {
        title: {
            text: 'Duration',
            style: this.fontColor
        },
        lineColor: '#fff',
        labels: {
          style: this.fontColor,
          formatter() { return TimeUtils.getDuration(this.value); }
        },

    },

    xAxis: {
        lineColor: '#fff',
        labels: {
          style: this.fontColor
        }
    },

    legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle',
        itemStyle: {
          color: this.fontColor.color
        }
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br />',
      formatter: (() => { const bind = this; return function() {
        const task = bind.jobs.concat(bind.jobs)[this.point.index];
        return `Job ${task.id} <br> ${this.point.series.name} : ${task.getHistoryPhase(this.point.series.name).duration} <br> Total Duration :  ${task.displayDuration}`; };
      })()
    },
    plotOptions: {
      area: {
        stacking: 'normal',

      }
    },
    rangeSelector: {
      verticalAlign: 'bottom',
    },
      series: [
        {
          type: 'area',
          name: 'Restoring',
          color: 'purple',
          data: []
        },
        {
          type: 'area',
          name: 'Executing',
          color: '#7FBA00',
          data: []
        },
        {
          type: 'area',
          name: 'Preparing',
          color: '#0075c9',
          data: []
        },
      ]
    };
    this.chart = chart('container', options);
    this.setGraph(this.jobs);
  }

  setGraph(infrastructureJobs: InfrastructureJob[]) {
    try {
      if (this.chart) {
        this.chart.series[2].setData(infrastructureJobs.map(task => task.getHistoryPhase('Preparing').durationMilliseconds));
        this.chart.series[1].setData(infrastructureJobs.map(task => task.getHistoryPhase('Executing')?.durationMilliseconds || 0));
        this.chart.series[0].setData(infrastructureJobs.map(task => task.getHistoryPhase('Restoring').durationMilliseconds));

        if (this.sortOrder) {
          this.chart.xAxis[0].setCategories(infrastructureJobs.map(task => Utils.result(task, this.sortOrder.displayPath ? this.sortOrder.displayPath : this.sortOrder.propertyPath.join('.'))));
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  ngOnChanges() {
    this.setGraph(this.jobs);
  }
}
