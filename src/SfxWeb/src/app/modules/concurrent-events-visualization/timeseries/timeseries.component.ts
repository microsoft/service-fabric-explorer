import { Component, OnInit, Input, OnChanges, OnDestroy, ViewChildren, ElementRef, AfterViewInit, QueryList } from '@angular/core';
import { Chart, Options, chart, SeriesOptionsType, Pointer, Point, color } from 'highcharts';
import { ListSettings } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
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

Pointer.prototype.reset = function () {
  return undefined;
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
  listSettings: ListSettings;

  constructor(private settings: SettingsService) { }

  fontColor = {
    color: '#fff'
  };

  public options: Options = {
    chart: {
      backgroundColor: null,
      height: 200,
    },
    title: {
      text: '',
      style: {
        color: 'white',
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
        setExtremes: this.getSync(),
      },
      lineColor: '#fff',
      labels: {
        style: this.fontColor
      },
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
    },
    colorAxis: [{
      gridLineColor: '#fff'
    }],
    series: []
  };

  ngOnInit(): void {
    this.listSettings = this.settings.getNewOrExistingListSettings("naming", [], []);
  }

  ngOnChanges() {

  }

  getSync() {
    const compRef = this;
    return function syncExtremes(e) {
      var thisChart = this.chart;
      console.log(compRef)
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
        return {
          x,
          y,
          itemData: item,
          events: {
            click: function(e) {
              console.log(this.itemData)
            }
          },
        };
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

  interactionEvent(e: MouseEvent, chartIndex: number) {
    const originChart = this.charts[chartIndex];
    const event = originChart.pointer.normalize(e);
    const point = (originChart.series[0] as any).searchPoint(event, true);
    if(point) {
      const pointIndex = point.index;

      this.charts.forEach(chart => {
        const referencePoint = chart.series[0].data[pointIndex];
        if (referencePoint) {
          referencePoint.onMouseOver(); // Show the hover marker
          chart.tooltip.refresh(referencePoint); // Show the tooltip
          chart.xAxis[0].drawCrosshair(null, referencePoint); // Show the crosshair
        }
      })
    }

  }
}
