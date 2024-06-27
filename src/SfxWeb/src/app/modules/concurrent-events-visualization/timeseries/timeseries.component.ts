import { Component, Input, OnChanges, OnDestroy, ViewChildren, ElementRef, AfterViewInit, QueryList, ViewChild, OnInit } from '@angular/core';
import { Chart, Options, chart, SeriesOptionsType, Pointer, PointOptionsObject, YAxisOptions, XAxisOptions } from 'highcharts';
import { debounceTime } from 'rxjs/operators';
import { ListSettings } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { Utils } from 'src/app/Utils/Utils';
import { Subscription, Subject, merge } from 'rxjs';

export interface IdataFormatter {
  name: string;
  xProperty: string;
  yProperty: string;
  xLabel?: string;
  xUnits?: string;
  yLabel?: string;
  yUnits?: string;
}

export interface IDataSet {
  values: any[],
  name: string;
}

export interface IParallelChartData {
  series: IdataFormatter[];
  dataSets: IDataSet[];
  listSettings: ListSettings;
}

Pointer.prototype.reset = function () {
  return undefined;
};

export const resize = () => {
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 1);
}

@Component({
  selector: 'app-timeseries',
  templateUrl: './timeseries.component.html',
  styleUrls: ['./timeseries.component.scss']
})
export class TimeseriesComponent implements AfterViewInit, OnChanges, OnDestroy, OnInit {

  @Input() data: IParallelChartData;
  @ViewChildren('container') private container: QueryList<ElementRef>;

  @ViewChild('inner') private inner: ElementRef<HTMLDivElement>;

  private charts: Chart[] = [];
  subscriptions: Subscription = new Subscription();
  listSettings: ListSettings;

  currentItems: any[];
  currentIndex = 0;
  currentItemsWidth = 400;
  resizer = new Subject<any>();

  constructor(private settings: SettingsService) { }

  fontColor = {
    color: '#fff'
  };

  public options: Options = {
    chart: {
      backgroundColor: null,
      height: 200,
      zooming: {
        type: 'x'
      },
      resetZoomButton: {
        position: {
          align: 'left',
          verticalAlign: 'top',
          y: -15
        }
      }
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
      },
      itemHoverStyle: {
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
          x: this.chart.chartWidth - (this as any).label.width - 10,
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
    this.subscriptions.add(merge(this.settings.treeWidth.pipe(debounceTime(1000)), this.resizer.pipe(debounceTime(500))).subscribe(() => {
      resize();
    }));
  }

  ngAfterViewInit() {
    this.generateCharts();
  }

  ngOnChanges() {
    if(this.container) {
      this.generateCharts();
    }
  }

  private generateCharts() {
    const data = this.generateChartData();

    this.container.forEach((element, index) => {
      const chart = this.charts[index];
      const chartData = data[index];

      if (chart) {
        chart.series.forEach(series => {
          if (chartData.series.every(set => set.name !== series.name)) {
            series.remove();
          } else {
            series.update(chartData.series.find(set => set.name === series.name));
          }
        });
        chartData.series.forEach(item => {
          if (chart.series.every(set => set.name !== item.name)) {
            chart.addSeries(item);
          }
        });
      } else {
        this.charts.push(new Chart(element.nativeElement, chartData));
      }
    })
  }

  private pickDataPoints(item: any, formatter: IdataFormatter) {
    return {
      x: Utils.result2(item, formatter.xProperty),
      y: Utils.result2(item, formatter.yProperty)
    }
  }

  private generateChartData() {
    const ref = this;
    const colorMap = {};
    this.data.dataSets.forEach(dataset => {
      colorMap[dataset.name] = Utils.randomColor();
    })

    return this.data.series.map((chartData, index) => {
      const dataSet: SeriesOptionsType[] = this.data.dataSets.map(dataset => {
        const values: PointOptionsObject[] = dataset.values.map(item => {
          const point = this.pickDataPoints(item, chartData);

          return {
            x: point.x,
            y: point.y,
            itemData: item,
            events: {
              click: function (e) {
                const points = this.series.chart.series.map(series => {
                  return (series as any).searchPoint(e, true)
                }).filter(point => !!point).map(p => {
                  return {
                    item: p.itemData,
                    pointData: p,
                    series: p.series,
                    tags: ref.data.series.map(data =>  {
                      return {
                        ...ref.pickDataPoints(p.itemData, data),
                        label: data.yLabel
                      }
                    })
                  }
                })
                ref.currentItems = points;
                ref.currentIndex = 0;

                resize();
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

      const yAxis: YAxisOptions = {
        labels: {
          style: this.fontColor,
        },
        title: {
          style: this.fontColor,
        }
      }

      if (chartData.yUnits) {
        yAxis.labels.format = `{value} ${chartData.yUnits}`
      }

      if (chartData.yLabel) {
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

      if (chartData.xUnits) {
        xAxis.labels.format = `{value} ${chartData.xUnits}`
      }

      if (chartData.xLabel) {
        xAxis.title.text = chartData.xLabel
      }
      return {
            ...this.options, series: dataSet, yAxis,
        }
    })
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

  ngOnDestroy() {
    this.charts.forEach(chart => {
      chart.destroy();
    })

    this.subscriptions.unsubscribe();
  }

  interactionEvent(e: MouseEvent, chartIndex: number) {
    const originChart = this.charts[chartIndex];
    const event = originChart.pointer.normalize(e);
    const points = originChart.series.map(series => {
      return (series as any).searchPoint(event, false)
    }).filter(point => !!point);

    if (points.length > 0) {
      let closestPoint = points[0];
      let closestDistance = Math.abs(closestPoint.clientX - (event.chartX - originChart.plotLeft));
      points.forEach(point => {
        let distance = Math.abs(point.clientX - (event.chartX - originChart.plotLeft));

        if (distance <= closestDistance) {
          closestPoint = point;
        }
      })

      let closestSeries = closestPoint.series;

      this.charts.forEach(chart => {
        const referencePoint = chart.series.find(series => series.name === closestSeries.name).data[closestPoint.index];
        if (referencePoint) {
          referencePoint.onMouseOver(); // Show the hover marker
          chart.tooltip.refresh(referencePoint); // Show the tooltip
          chart.xAxis[0].drawCrosshair(null, referencePoint); // Show the crosshair
        }
      })
    }
  }

  clearSelectedPoint() {
    this.currentItems = null;
    resize();
  }

  resize(value: number) {
    const boundingBox = this.inner.nativeElement.getBoundingClientRect();
    const width = boundingBox.width - Math.max(20, value -  boundingBox.x );
    this.currentItemsWidth = width;
    this.resizer.next(width);
  }

  itemTrackBy(index, item) {
    return item.series.name;
  }
}
