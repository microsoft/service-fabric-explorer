import { Component, Input, OnChanges, OnInit, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Chart, Options, chart } from 'highcharts';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { ISortOrdering } from 'src/app/modules/detail-list-templates/detail-list/detail-list.component';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { Utils } from 'src/app/Utils/Utils';

@Component({
  selector: 'app-repair-job-chart',
  templateUrl: './repair-job-chart.component.html',
  styleUrls: ['./repair-job-chart.component.scss']
})
export class RepairJobChartComponent implements OnInit, OnChanges {

  @Input() jobs: RepairTask[];
  @Input() sortOrder: ISortOrdering;

  fontColor = {
    color: '#fff'
  };

  private chart: Chart;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    const options: Options = {
      chart: {
        type: 'area',
        zooming: {
          type: 'x'
        },
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
        formatter: (() => {
          const bind = this; return function () {
            return bind.sanitizer.sanitize(SecurityContext.HTML, TimeUtils.getDuration(this.value));
          }
        })()
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
        },
        itemHoverStyle: {
          color: this.fontColor.color
        }
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br />',
      formatter: (() => { const bind = this; return function() {
        const task = bind.jobs.concat(bind.jobs)[this.point.index];
        const formatted = bind.sanitizer.sanitize(SecurityContext.HTML, `Job ${task.id} <br> ${this.point.series.name} : ${task.getHistoryPhase(this.point.series.name).duration} <br> Total Duration :  ${task.displayDuration}`);
        return formatted};
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
      ],
      credits: {enabled: false}
    };
    this.chart = chart('repair-job-chart-container', options);
    this.setGraph(this.jobs);
  }

  setGraph(repairTasks: RepairTask[]) {
    try {
      if (this.chart) {
        this.chart.series[2].setData(repairTasks.map(task => task.getHistoryPhase('Preparing').durationMilliseconds));
        this.chart.series[1].setData(repairTasks.map(task => task.getHistoryPhase('Executing')?.durationMilliseconds || 0));
        this.chart.series[0].setData(repairTasks.map(task => task.getHistoryPhase('Restoring').durationMilliseconds));

        if (this.sortOrder) {
          this.chart.xAxis[0].setCategories(repairTasks.map(task => Utils.result(task, this.sortOrder.displayPath ? this.sortOrder.displayPath : this.sortOrder.propertyPath.join('.'))));
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
