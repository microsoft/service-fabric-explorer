import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Chart, Options, chart } from 'highcharts';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { TimeUtils } from 'src/app/Utils/TimeUtils';

@Component({
  selector: 'app-repair-job-chart',
  templateUrl: './repair-job-chart.component.html',
  styleUrls: ['./repair-job-chart.component.scss']
})
export class RepairJobChartComponent implements OnInit, OnChanges {

  @Input() jobs: RepairTask[];

  fontColor = {
    color: '#fff'
  };

  private chart: Chart;

  constructor() { }

  ngOnInit(): void {
    const options: Options = {
      chart: {
        type:'area',
        zoomType: 'x',
        backgroundColor: '#191919'
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
          formatter: function() { return TimeUtils.getDuration(this.value) }
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
      formatter: (() => { let bind = this; return function () { 
        const task = bind.jobs.concat(bind.jobs)[this.point.category];
        return `Job ${task.id} <br> ${this.point.series.name} : ${task.getHistoryPhase(this.point.series.name).duration} <br> Total Duration :  ${task.displayDuration}`; } 
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
    }
    this.chart = chart('container', options);
    this.setGraph(this.jobs);
  }

  setGraph(repairTasks: RepairTask[]) {
    try {
      if (this.chart) {
        this.chart.series[2].setData(repairTasks.map(task => task.getHistoryPhase('Preparing').durationMilliseconds))
        this.chart.series[1].setData(repairTasks.map(task => task.getHistoryPhase('Executing')?.durationMilliseconds || 0))
        this.chart.series[0].setData(repairTasks.map(task => task.getHistoryPhase('Restoring').durationMilliseconds))
      }
    } catch(e) {
      console.log(e)
    }
  }

  ngOnChanges() {
    this.setGraph(this.jobs);
  }
}
