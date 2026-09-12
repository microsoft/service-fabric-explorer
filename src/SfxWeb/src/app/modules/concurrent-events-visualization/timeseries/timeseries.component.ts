import { Component, Input, OnChanges, OnDestroy, ViewChildren, ElementRef, AfterViewInit, QueryList, ViewChild, OnInit, inject, ChangeDetectionStrategy, SimpleChanges } from '@angular/core';
import { Chart, Options, chart, SeriesOptionsType, Pointer, PointOptionsObject, YAxisOptions, XAxisOptions, Axis, PointClickEventObject, Point, Series } from 'highcharts';
import { debounceTime } from 'rxjs/operators';
import { ListSettings } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { Utils } from 'src/app/Utils/Utils';
import { Subscription, Subject, merge } from 'rxjs';

declare module 'highcharts' {
  // itemData: attached by us via the point's options; clientX: set at runtime by Series.searchPoint’s k-d-tree lookup
  interface Point {
    itemData?: any;
    clientX: number;
  }
}

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

interface ISelectedItem {
  item: any;
  pointData: Point;
  series: Series;
  tags: { x: number; y: number; label?: string }[];
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
    styleUrls: ['./timeseries.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TimeseriesComponent implements AfterViewInit, OnChanges, OnDestroy, OnInit {
  private settings = inject(SettingsService);


  @Input() data!: IParallelChartData;
  @Input() modern = false;
  public chartHeights: Record<string, number> = {};
  private heightDrag?: { pointer: number; y: number; height: number; name: string };
  public hiddenSeries = new Map<string, Set<string>>();

  public resizeChartHeight(event: PointerEvent, name: string) {
    const handle = event.currentTarget as HTMLElement;
    if (event.type === 'pointerdown') {
      if (event.button !== 0 || !this.modern) { return; }
      this.heightDrag = { pointer: event.pointerId, y: event.clientY, height: this.chartHeights[name] || 260, name };
      handle.setPointerCapture(event.pointerId);
      handle.focus({ preventScroll: true });
      event.preventDefault();
    } else if (this.heightDrag?.pointer === event.pointerId) {
      if (event.type === 'pointermove') {
        this.setChartHeight(this.heightDrag.name, this.heightDrag.height + event.clientY - this.heightDrag.y);
      } else {
        this.heightDrag = undefined;
        if (handle.hasPointerCapture(event.pointerId)) { handle.releasePointerCapture(event.pointerId); }
      }
    }
  }

  private setChartHeight(name: string, height: number) {
    this.chartHeights[name] = Math.max(200, Math.min(800, Math.round(height)));
    this.charts[this.data.series.findIndex(series => series.name === name)]?.setSize(undefined, this.chartHeights[name], false);
  }

  public resizeChartKey(event: KeyboardEvent, name: string) {
    const height = this.chartHeights[name] || 260;
    if (event.key === 'ArrowDown') { this.setChartHeight(name, height + 20); }
    else if (event.key === 'ArrowUp') { this.setChartHeight(name, height - 20); }
    else if (event.key === 'Home') { this.setChartHeight(name, 260); }
    else { return; }
    event.preventDefault();
    event.stopPropagation();
  }

  public seriesColor(name: string) { return this.seriesColors.get(name) || '#58a6ff'; }
  public toggleSeries(chartName: string, seriesName: string) {
    const hidden = this.hiddenSeries.get(chartName) || new Set<string>();
    if (hidden.has(seriesName)) { hidden.delete(seriesName); } else { hidden.add(seriesName); }
    this.hiddenSeries.set(chartName, hidden);
    this.charts[this.data.series.findIndex(series => series.name === chartName)]?.series.find(series => series.name === seriesName)?.setVisible(!hidden.has(seriesName), true);
  }
  public dataSeries = '';
  public get selectedDataSet() { return this.data.dataSets.find(set => set.name === this.dataSeries) || this.data.dataSets[0]; }
  private readonly seriesColors = new Map<string, string>();
  private chartResize?: ResizeObserver;
  @ViewChildren('container') private container!: QueryList<ElementRef>;

  @ViewChild('inner') private inner!: ElementRef<HTMLDivElement>;

  private charts: Chart[] = [];
  subscriptions: Subscription = new Subscription();
  listSettings!: ListSettings;

  currentItems?: ISelectedItem[] | null;
  currentIndex = 0;
  currentItemsWidth = 400;
  resizer = new Subject<number>();

  fontColor = {
    color: '#fff'
  };

  public options: Options = {
    chart: {
      backgroundColor: 'transparent',
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
      positioner: function (labelWidth) {
        return {
          // right aligned
          x: this.chart.chartWidth - labelWidth - 10,
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
    this.subscriptions.add(this.container.changes.subscribe(() => {
      this.charts.forEach(chart => chart.destroy());
      this.charts = [];
      this.currentItems = null;
      this.generateCharts();
      this.observeCharts();
    }));
    this.chartResize = new ResizeObserver(() => this.charts.forEach(chart => chart.reflow()));
    this.observeCharts();
  }

  private observeCharts() {
    this.chartResize?.disconnect();
    this.container.forEach(element => this.chartResize?.observe(element.nativeElement));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.modern && !changes.modern.firstChange) {
      // Recreate charts to discard mode-specific options and stale point references.
      this.charts.forEach(chart => chart.destroy());
      this.charts = [];
      this.currentItems = null;
    }
    if (this.modern) {
      this.currentItems = null;
      if (!this.data.dataSets.some(set => set.name === this.dataSeries)) { this.dataSeries = this.data.dataSets[0]?.name || ''; }
    }
    if(this.container) {
      this.generateCharts();
    }
  }

  private generateCharts() {
    const data = this.generateChartData();

    this.container.forEach((element, index: number) => {
      const chart = this.charts[index];
      const chartData = data[index];

      if (chart) {
        [...chart.series].forEach(series => {
          if (chartData.series.every(set => set.name !== series.name)) {
            series.remove(false);
          } else {
            series.update(chartData.series.find(set => set.name === series.name)!, false);
          }
        });
        chartData.series.forEach((item: any) => {
          if (chart.series.every(set => set.name !== item.name)) {
            chart.addSeries(item, false);
          }
        });
        chart.redraw(false);
      } else {
        this.charts.push(new Chart(element.nativeElement, chartData));
      }
    })
  }

  private pickDataPoints(item: any, formatter: IdataFormatter): { x: number; y: number } {
    return {
      x: Utils.result2(item, formatter.xProperty),
      y: Utils.result2(item, formatter.yProperty)
    }
  }

  private generateChartData() {
    const ref = this;
    const colorMap: Record<string, string> = {};
    this.data.dataSets.forEach(dataset => {
      if (this.modern) {
        const palette = ['#58a6ff', '#3fb950', '#bc8cff', '#e3b341', '#f778ba', '#79c0ff', '#ffa657'];
        if (!this.seriesColors.has(dataset.name)) { this.seriesColors.set(dataset.name, palette[this.seriesColors.size % palette.length]); }
        colorMap[dataset.name] = this.seriesColors.get(dataset.name)!;
      } else { colorMap[dataset.name] = Utils.randomColor(); }
    })

    return this.data.series.map((chartData, index: number) => {
      const dataSet: SeriesOptionsType[] = this.data.dataSets.map(dataset => {
        const values: PointOptionsObject[] = dataset.values.map((item: any) => {
          const point = this.pickDataPoints(item, chartData);

          return {
            x: point.x,
            y: point.y,
            itemData: item,
            events: {
              click: function (e: PointClickEventObject) {
                const points = this.series.chart.series.map(series => {
                  return series.searchPoint(e, true)
                }).filter((point): point is Point => !!point).map(p => {
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
          animation: this.modern ? false : undefined,
          ...(this.modern ? { visible: !this.hiddenSeries.get(chartData.name)?.has(dataset.name) } : {}),
          ...(this.modern ? { marker: { enabled: values.length === 1 } } : {}),
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
        yAxis.labels!.format = `{value} ${chartData.yUnits}`
      }

      if (chartData.yLabel) {
        yAxis.title!.text = chartData.yLabel
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
        xAxis.labels!.format = `{value} ${chartData.xUnits}`
      }

      if (chartData.xLabel) {
        xAxis.title!.text = chartData.xLabel
      }
      return {
            ...this.options, series: dataSet, yAxis: this.modern ? { ...yAxis, gridLineColor: '#30363d', labels: { ...yAxis.labels, style: { color: '#8b949e', fontSize: '15px' } } } : yAxis,
            ...(this.modern ? {
              chart: { ...this.options.chart, height: this.chartHeights[chartData.name] || 260, animation: false },
              legend: { enabled: false },
              tooltip: { backgroundColor: '#21262d', borderColor: '#484f58', borderWidth: 1, style: { color: '#e6edf3', fontSize: '15px' }, outside: false },
              xAxis: { ...this.options.xAxis as XAxisOptions, lineColor: '#30363d', tickColor: '#30363d', labels: { style: { color: '#8b949e', fontSize: '15px' } } }
            } : {}),
            title: { text: chartData.name, style: { color: 'white', opacity: 0 } },
            accessibility: {
              enabled: true,
              description: chartData.name,
              landmarkVerbosity: 'one' as const,
              point: { valueDescriptionFormat: '{point.name}, {point.y}' }
            },
        }
    })
  }

  getSync() {
    const compRef = this;
    return function syncExtremes(this: any, e: any) {
      var thisChart = this.chart;
      if (e.trigger !== 'syncExtremes') { // Prevent feedback loop
        compRef.charts.forEach((chart) => {
          if (chart !== thisChart) {
            if ((chart.xAxis[0] as Axis | undefined)?.setExtremes) { // It is null while updating
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
    this.chartResize?.disconnect();
    this.charts.forEach(chart => {
      chart.destroy();
    })

    this.subscriptions.unsubscribe();
  }

  interactionEvent(e: MouseEvent, chartIndex: number) {
    const originChart = this.charts[chartIndex];
    if (!originChart) { return; }
    const event = originChart.pointer.normalize(e);
    const points = originChart.series.map(series => {
      return series.searchPoint(event, false)
    }).filter((point): point is Point => !!point);

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
        const referencePoint = chart.series.find(series => series.name === closestSeries.name)?.data[closestPoint.index];
        if (referencePoint) {
          referencePoint.onMouseOver(); // Show the hover marker
          chart.tooltip.refresh(referencePoint); // Show the tooltip
          chart.xAxis[0].drawCrosshair(null!, referencePoint); // Show the crosshair
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

  itemTrackBy(index: number, item: ISelectedItem) {
    return item.series.name;
  }
}
