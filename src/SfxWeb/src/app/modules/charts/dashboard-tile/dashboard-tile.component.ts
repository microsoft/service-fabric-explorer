import { Component, OnInit, ViewChild, ElementRef, Input, AfterViewInit, OnChanges } from '@angular/core';
import { IDashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { Chart, Options, chart, PointOptionsObject, SeriesPieOptions } from 'highcharts';

@Component({
  selector: 'app-dashboard-tile',
  templateUrl: './dashboard-tile.component.html',
  styleUrls: ['./dashboard-tile.component.scss']
})
export class DashboardTileComponent implements OnInit, AfterViewInit, OnChanges {

  @Input() data: IDashboardViewModel;

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
    },
    title: {
      text: 'test',
      align: 'left',
      verticalAlign: 'middle',
      y: 0,
      x: 10,
      style: {
        color: '#fff',
        fontSize: '14pt',
        fontWeight: 'normal'
      }
    },
    subtitle: {
      text: '5',
      align: 'left',
      verticalAlign: 'middle',
      x: 25,
      y: 50,
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
        innerSize: '85%',
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
          opacity: 1
        }
      }
    }]
  };

  constructor() { }

  ngOnInit() {
    const margin = 3;
    const width = (this.data.largeTile ? 230 : 150) + margin * 2;
    this.options.chart.height = width;
    this.options.chart.width = width;

    this.options.title.text = this.data.displayTitle;
    this.options.subtitle.text = this.data.count.toString();

    const data = this.getDataSet();
    this.options.tooltip.enabled = data.length === 3;
    (this.options.series[0] as SeriesPieOptions).data = data;

    if (!this.data.largeTile) {
      this.options.title.y = 9;
      this.options.subtitle.style.fontSize = '14pt';
      this.options.subtitle.y = 30;
    }
  }

  ngAfterViewInit() {
    this.chart = chart(this.chartContainer.nativeElement, this.options);
  }

  getDataSet(): PointOptionsObject[] {
    const colors = {
      Healthy: 'var(--badge-ok)',
      Warning: 'var(--badge-warning)',
      Error: 'var(--badge-error)'
    };

    const data = this.data.dataPoints.map(p => {
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
      this.chart.title.update({ text: this.data.displayTitle });
      this.chart.subtitle.update({text: this.data.count.toString()});
    }
  }

}
