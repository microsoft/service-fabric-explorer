import { Component, OnInit, ViewChild, ElementRef, Input, OnChanges, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { ExperienceService } from 'src/app/services/experience.service';
import { IDashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { Chart, Options, chart, PointOptionsObject, SeriesPieOptions } from 'highcharts';

@Component({
    selector: 'app-dashboard-tile',
    templateUrl: './dashboard-tile.component.html',
    styleUrls: ['./dashboard-tile.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
    host: { '[class.modern-health-tile]': 'experience.isNew()' }
})
export class DashboardTileComponent implements OnInit, OnChanges, OnDestroy {

  @Input() data!: IDashboardViewModel;

  @ViewChild('chart') private set chartContainer(container: ElementRef | undefined) {
    this.chart?.destroy();
    this.chart = undefined;
    if (container) {
      this.chart = chart(container.nativeElement, {
        ...this.options,
        title: { ...this.options.title, text: this.data.displayTitle },
        subtitle: { ...this.options.subtitle, text: String(this.data.count) },
        series: [{ ...(this.options.series![0] as SeriesPieOptions), type: 'pie', data: this.getDataSet() }]
      });
    }
  }

  private chart?: Chart;
  public segments: { length: number; offset: number; color: string; title: string }[] = [];
  public experience = inject(ExperienceService);

  public healthColor(title: string): string {
    return ({ Healthy: '#3fb950', Up: '#3fb950', Warning: '#d29922', Disabled: '#d29922', Error: '#f85149', Down: '#f85149' } as Record<string, string>)[title] || '#8b949e';
  }

  fontColor = {
    color: '#fff'
  };

  public options: Options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
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

  ngOnInit() {
    const margin = 3;
    const width = (this.data.largeTile ? 230 : 150) + margin * 2;
    this.options.chart!.height = width;
    this.options.chart!.width = width;

    this.options.title!.text = this.data.displayTitle;
    this.options.subtitle!.text = this.data.count.toString();

    const data = this.getDataSet();
    this.options.tooltip!.enabled = data.length === 3;
    (this.options.series![0] as SeriesPieOptions).data = data;

    if (!this.data.largeTile) {
      this.options.title!.y = 9;
      this.options.subtitle!.style!.fontSize = '14pt';
      this.options.subtitle!.y = 30;
    }
  }

  ngOnDestroy() { this.chart?.destroy(); }

  getDataSet(): PointOptionsObject[] {
    const colors = {
      // Node health state
      Healthy: 'var(--badge-ok)',
      Warning: 'var(--badge-warning)',
      Error: 'var(--badge-error)',

      // Node status
      Up: 'var(--badge-ok)',
      Disabled: 'var(--badge-warning)',
      Down: 'var(--badge-error)'
    };

    const data = this.data.dataPoints.map(p => {
      return {
        name: p.title,
        y: p.count,
        color: colors[p.title as keyof typeof colors]
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
    const total = this.data.dataPoints.reduce((sum, point) => sum + Math.max(0, point.count), 0);
    let offset = 0;
    this.segments = this.data.dataPoints.filter(point => point.count > 0).map(point => {
      const length = total ? point.count / total * 100 : 0;
      const segment = { length, offset: -offset, color: this.healthColor(point.title), title: `${point.title}: ${point.count}` };
      offset += length;
      return segment;
    });
    if (this.chart) {
      const data = this.getDataSet();
      this.chart.tooltip.update({ enabled: data.length === 3 });
      this.chart.series[0].setData(data);
      this.chart.title.update({ text: this.data.displayTitle });
      this.chart.subtitle.update({text: this.data.count.toString()});
    }
  }

}
