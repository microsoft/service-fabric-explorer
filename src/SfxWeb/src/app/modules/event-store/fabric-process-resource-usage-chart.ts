import { Options, SeriesOptionsType } from 'highcharts';

export function createFabricProcessResourceUsageChartOptions(
  series: SeriesOptionsType[],
  sharedTooltip = false
): Options {
  return {
    chart: {
      type: 'line',
      height: 320,
      animation: false,
      backgroundColor: 'transparent',
      zooming: { type: 'x' }
    },
    title: { text: undefined },
    credits: { enabled: false },
    legend: {
      itemStyle: { color: '#f2f2f2' },
      itemHoverStyle: { color: '#ffffff' }
    },
    xAxis: {
      type: 'datetime',
      lineColor: '#a6a6a6',
      tickColor: '#a6a6a6',
      labels: { style: { color: '#f2f2f2' } }
    },
    yAxis: {
      min: 0,
      max: 100,
      title: {
        text: 'Utilization (%)',
        style: { color: '#f2f2f2' }
      },
      labels: {
        format: '{value}%',
        style: { color: '#f2f2f2' }
      },
      gridLineColor: '#555555'
    },
    tooltip: {
      shared: sharedTooltip,
      xDateFormat: '%Y-%m-%d %H:%M:%S UTC',
      pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y:.2f}%</b>{point.custom.detail}<br/>'
    },
    plotOptions: {
      line: {
        lineWidth: 2,
        marker: { enabled: false },
        gapSize: 2,
        gapUnit: 'relative'
      },
      series: {
        animation: false,
        connectNulls: false
      }
    },
    series
  };
}
