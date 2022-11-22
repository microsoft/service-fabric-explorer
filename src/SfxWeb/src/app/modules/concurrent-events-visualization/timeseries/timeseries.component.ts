import { Component, OnInit, Input, OnChanges, OnDestroy, ViewChildren, ElementRef, AfterViewInit, QueryList } from '@angular/core';
import { Chart, Options, chart, SeriesOptionsType, Pointer, Point, color, PointOptionsObject, YAxisLabelsOptions, YAxisOptions, XAxisOptions } from 'highcharts';
import { ListColumnSetting, ListSettings } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { Utils } from 'src/app/Utils/Utils';

export interface IdataFormatter {
  name: string;
  xProperty: string;
  yProperty: string;
  xLabel?: string;
  xUnits?: string;
  yLabel?: string;
  yUnits?: string;
}

export interface  IDataSet{
  values: any[],
  name: string;
}

export interface IParallelChartData {
  series: IdataFormatter[];
  dataSets: IDataSet[];
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
  currentItem: any;

  visibleItems = new Set();

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
      enabled: true,
      itemStyle: {
        color: '#fff'
      }
    },
    xAxis: {
      type: 'datetime',
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
    const keys = Object.keys(this.data.dataSets[0].values[0]);

    this.listSettings = this.settings.getNewOrExistingListSettings("naming", [
    ],       keys.map(key => {
      return new ListColumnSetting(key, key)
    }).splice(0,5));
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
    const ref = this;

    const colorMap = {};
    this.data.dataSets.forEach(dataset => {
      colorMap[dataset.name] = Utils.randomColor();
    })

    this.data.series.forEach((chartData, index) => {

      const dataSet: SeriesOptionsType[] = this.data.dataSets.map(dataset => {
        const values: PointOptionsObject[] = dataset.values.map(item => {
          const x = Utils.result(item, chartData.xProperty);
          const y = Utils.result(item, chartData.yProperty);
          return {
            x,
            y,
            itemData: item,
            events: {
              mouseOver: function (e) {
                ref.currentItem = (this as any).itemData;
              }
            },
          }
        });

        return {
          name: dataset.name,
          type: 'line',
          data: values,
          dataLabels: {
            style: this.fontColor,
          },
          color: colorMap[dataset.name]
        }

      })
      console.log(dataSet)
      const yAxis: YAxisOptions = {
        labels: {
          style: this.fontColor,
        },
        title: {
          style: this.fontColor,
        }
      }

      if(chartData.yUnits) {
        yAxis.labels.format = `{value} ${chartData.yUnits}`
      }

      if(chartData.yLabel) {
        yAxis.title.text = chartData.yLabel
      }

      const xAxis: XAxisOptions = {
        labels: {
          style: this.fontColor,
        },
        title: {
          style: this.fontColor,
        },

      }

      if(chartData.xUnits) {
        xAxis.labels.format = `{value} ${chartData.xUnits}`
      }

      if(chartData.xLabel) {
        xAxis.title.text = chartData.xLabel
      }


      this.charts.push(chart(this.container.get(index).nativeElement, {
        ...this.options, series: dataSet, yAxis,
        // xAxis
      }));
    })

    console.log(this)
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
