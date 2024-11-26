import { Component, OnInit, ViewChild, ElementRef, Input, AfterViewInit, OnChanges } from '@angular/core';
import { IDashboardDataPointViewModel, IDashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { Chart, Options, chart, PointOptionsObject, SeriesPieOptions } from 'highcharts';

@Component({
  selector: 'app-health-chart',
  templateUrl: './health-chart.component.html',
  styleUrls: ['./health-chart.component.scss']
})
export class HealthChartComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() data: IDashboardDataPointViewModel[];
  @Input() width = '80';
  @Input() title: number | string = '';

  @ViewChild('chart') private chartContainer: ElementRef;

  private chart: Chart;

  fontColor = {
    color: '#fff'
  };

  public options: Options = {
    chart: {
      type: 'pie',
      backgroundColor: null,
      borderRadius: 0,
      margin: [0, 0, 0, 0],
      spacingTop: 0,
      spacingBottom: 0,
      spacingLeft: 0,
      spacingRight: 0,
    },
    title: {
      text: '',
      align: 'left',
      verticalAlign: 'middle',
      y: 0,
      x: 30,
      style: {
        color: '#fff',
        fontSize: '15pt'
      }
    },
    subtitle: {
      text: '5',
      align: 'left',
      verticalAlign: 'middle',
      style: {
        color: '#fff',
        fontSize: '28pt'
      }
    },
    tooltip: {
      enabled: false,
      animation: false,
      formatter() {
        return `${this.point.name} : ${this.y}`;
      }
    },
    credits: { enabled: false },
    loading: {
      showDuration: 0
    },
    plotOptions: {
      pie: {
        borderColor: '#191919',
        borderWidth: 2,
        dataLabels: {
          enabled: false,
          distance: -50,
          style: {
            fontWeight: 'bold',
            color: 'white'
          }
        },
        innerSize: '60%',
        startAngle: -50,
        endAngle: 230,
      }
    },
    series: [{
      animation: false,
      type: 'pie',
      data:
        [
          {
            name: '',
            y: 1,
            color: 'gray'
          }
        ],
      states: {
        inactive: {
          opacity: 1
        },
        hover: {
          halo: {
            size: 0
          }
        }
      }
    }]
  };

  constructor() { }

  ngOnInit() {
    this.options.chart.height = this.width;
    this.options.chart.width = this.width;
    this.options.subtitle.text = this.title.toString();

    const data = this.getDataSet();
    this.options.tooltip.enabled = data.length === 3;
    (this.options.series[0] as SeriesPieOptions).data = data;

    this.options.subtitle.style.fontSize =  +this.width * .2 + 'pt';
  }

  ngAfterViewInit() {
    this.chart = chart(this.chartContainer.nativeElement, this.options);
  }

  getDataSet(): PointOptionsObject[] {
    const colors = {
      Healthy: '#7FBA00',
      Warning: '#FCD116',
      Error: '#E81123'
    };

    const data = this.data.map(p => {
      return {
        name: p.title,
        y: p.count,
        color: colors[p.title]
      };
    });

    // if there is no data we want gray rings.
    // so we need to push a gray entry
    if (data.every(d => d.y === 0)) {
      data.push({
        name: '',
        y: 1,
        color: 'gray'
      });
    }
    return data;
  }

  ngOnChanges() {
    if (this.chart) {
      const data = this.getDataSet();
      this.chart.tooltip.update({ enabled: data.length === 3 });
      this.chart.series[0].setData(data);
      this.chart.subtitle.update({text: this.title.toString()});
    }
  }
}
