import { Component, OnInit, Input, OnChanges, OnDestroy, ViewChildren, ElementRef, AfterViewInit, QueryList } from '@angular/core';
import { Chart, Options, chart, SeriesOptionsType, TooltipFormatterCallbackFunction, Point, color } from 'highcharts';
import { Utils } from 'src/app/Utils/Utils';

export interface IDataSet {
  name: string;
  xProperty: string;
  yProperty: string;
}

export interface IParallelChartData {
  series: IDataSet[];
  dataSet: any[];
}

Point.prototype['highlight'] = function (event) {
  event = this.series.chart.pointer.normalize(event);
  this.onMouseOver(); // Show the hover marker
  this.series.chart.tooltip.refresh(this); // Show the tooltip
  this.series.chart.xAxis[0].drawCrosshair(event, this); // Show the crosshair
};


@Component({
  selector: 'app-timeseries',
  templateUrl: './timeseries.component.html',
  styleUrls: ['./timeseries.component.scss']
})
export class TimeseriesComponent implements AfterViewInit, OnChanges, OnDestroy {

  @Input() data: IParallelChartData;

  private charts: Chart[] = [];
  @ViewChildren('container') private container: QueryList<ElementRef>;

  constructor() { }

  fontColor = {
    color: '#fff'
  };

  public options: Options = {
    chart: {
      backgroundColor: null,
      // margin: [0, 0, 0, 0],
      // spacingTop: 0,
      // spacingBottom: 0,
      // spacingLeft: 0,
      // spacingRight: 0,
      // width: '100%',
      height: 200
    },
    title: {
      text: '',
      style: {
        color: 'white',
        // fontSize: `${this.titleSizePx}px`
      }
    },
    credits: {
      enabled: false
    },
    legend: {
      enabled: false
    },
    xAxis: {
      crosshair: true,
      events: {
        setExtremes: this.getSync()
      },
      lineColor: '#fff',
      labels: {
        format: '{value} km',
        style: this.fontColor
      },
      accessibility: {
        description: 'Kilometers',
        rangeDescription: '0km to 6.5km'
      }
    },
    yAxis: {
      gridLineColor: '#fff',
      title: {
        text: null
      }
    },
    tooltip: {
      positioner: function () {
        return {
          // right aligned
          x: this.chart.chartWidth - (this as any).label.width,
          y: 10 // align to title
        };
      },
      borderWidth: 0,
      backgroundColor: 'none',
      pointFormat: '{point.y}',
      headerFormat: '',
      shadow: false,
      style: {
        fontSize: '18px',
        color: 'white'
      },
      // valueDecimals: dataset.valueDecimals
    },
    colorAxis: [{
      gridLineColor: '#fff'
    }],
    series: [
      // {
      // data: dataset.data,
      // name: dataset.name,
      // type: dataset.type,
      // color: Highcharts.getOptions().colors[i],
      // fillOpacity: 0.3,
      // tooltip: {
      //   valueSuffix: ' ' + dataset.unit
      // }
    // }
  ]
  };

  ngOnInit(): void {
  }

  ngOnChanges() {

  }

  getSync() {
    const compRef = this;
    return function syncExtremes(e) {
      var thisChart = this.chart;

      if (e.trigger !== 'syncExtremes') { // Prevent feedback loop
          compRef.charts.forEach((chart) => {
              if (chart !== thisChart) {
                  if (chart.xAxis[0].setExtremes) { // It is null while updating
                      chart.xAxis[0].setExtremes(
                          e.min,
                          e.max,
                          undefined,
                          false,
                          { trigger: 'syncExtremes' }
                      );
                  }
              }
          });
      }
    }
  }

  ngAfterViewInit() {
    this.charts = [];
    this.data.series.forEach((chartData, index) => {
      const dataSet = this.data.dataSet.map(item => {
        const x = Utils.result(item, chartData.xProperty);
        const y = Utils.result(item, chartData.yProperty);
        return [x,y];
      })
      this.charts.push(chart(this.container.get(index).nativeElement, {...this.options, series: [
        {
          type:'line',
          data: dataSet,
          dataLabels: {
            style: this.fontColor
          }
        }
      ]}));
    })
  }

  ngOnDestroy() {
    this.charts.forEach(chart => {
      chart.destroy();
    })
  }

  interactionEvent(e: MouseEvent) {
    this.charts.forEach(chart => {
      const event = chart.pointer.normalize(e);
      const point = (chart.series[0] as any).searchPoint(event, true);

      if (point) {
        point.highlight(e);
      }
    })
  }

}


// ['mousemove', 'touchmove', 'touchstart'].forEach(function (eventType) {
//   document.getElementById('container').addEventListener(
//       eventType,
//       function (e) {
//           var chart,
//               point,
//               i,
//               event;

//           for (i = 0; i < Highcharts.charts.length; i = i + 1) {
//               chart = Highcharts.charts[i];
//               // Find coordinates within the chart
//               event = chart.pointer.normalize(e);
//               // Get the hovered point
//               point = chart.series[0].searchPoint(event, true);

//               if (point) {
//                   point.highlight(e);
//               }
//           }
//       }
//   );
// });
