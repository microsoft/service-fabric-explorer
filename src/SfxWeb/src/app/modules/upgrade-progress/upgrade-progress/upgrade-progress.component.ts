import { Component, Input, ChangeDetectionStrategy, AfterViewInit, ViewChild, ElementRef, OnChanges, OnDestroy, SecurityContext, inject, effect } from '@angular/core';
import { ExperienceService } from 'src/app/services/experience.service';
import { UpgradeDomain } from 'src/app/Models/DataModels/Shared';
import { Chart, Options, chart, PointOptionsObject } from 'highcharts';
import { Counter } from 'src/app/Utils/Utils';
import { BadgeConstants, UpgradeDomainStateNames } from 'src/app/Common/Constants';
import { DomSanitizer } from '@angular/platform-browser';

interface ITileCount {
  css: string;
  uds: UpgradeDomain[];
  name: string;
}
@Component({
    selector: 'app-upgrade-progress',
    templateUrl: './upgrade-progress.component.html',
    styleUrls: ['./upgrade-progress.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class UpgradeProgressComponent implements AfterViewInit, OnChanges, OnDestroy {
  private sanitizer = inject(DomSanitizer);
  public experience = inject(ExperienceService);
  private resizeObserver?: ResizeObserver;
  private chartMode?: boolean;

  constructor() {
    effect(() => {
      this.experience.isNew();
      this.resizeChart();
    });
  }

  private resizeChart() {
    if (!this.chart) { return; }
    const modern = this.experience.isNew();
    const width = modern ? Math.round(this.chartContainer.nativeElement.parentElement.clientWidth) - 24 : 350;
    if (!width) { return; }
    const modeChanged = this.chartMode !== modern;
    if (modeChanged) {
      this.chartMode = modern;
      this.chart.update({
        chart: { animation: !modern, spacing: modern ? [12, 12, 12, 12] : [10, 10, 15, 10] },
        plotOptions: { series: { animation: !modern, dataLabels: { enabled: true } }, pie: { size: null, dataLabels: { enabled: true, distance: 30 } } }
      }, false);
    }
    const height = 300;
    if (this.chart.chartWidth !== width || this.chart.chartHeight !== height) {
      this.chart.setSize(width, height, false);
    } else if (modeChanged) { this.chart.redraw(false); }
  }

  ngOnDestroy() { this.resizeObserver?.disconnect(); this.chart?.destroy(); }


  @Input() upgradeDomains!: UpgradeDomain[];
  @Input() showChart = false;

  @ViewChild('chart') private chartContainer!: ElementRef;

  chart!: Chart;

  tiles: ITileCount[] = [];
  displayUd: UpgradeDomain[] = [];

  ngAfterViewInit() {
    if (this.showChart) {
      const modern = this.experience.isNew();
      const dataSet = this.getDataSet();
      this.chart = chart(this.chartContainer.nativeElement, {
        chart: {
            type: 'pie',
            width: modern ? Math.max(1, this.chartContainer.nativeElement.parentElement.clientWidth - 24) : 350,
            height: 300,
            animation: !modern,
            backgroundColor: 'transparent',
            borderRadius: 0
        },
        title: {
          text: '',
          verticalAlign: 'middle',
          style: {
            color: '#1234',
            fontSize: '15pt'
          }
        },
        credits: { enabled: false },
        plotOptions: {
            pie: {
                animation: !modern,
                borderWidth: 2,
                innerSize: '50%',
                borderColor:  '#262626'
            },
            series: {
              animation: !modern,
              dataLabels: {
                  enabled: true,
                  color: 'white',
                  borderColor: 'white',
                  inside: true,
                  textPath: {
                    enabled: false
                  }
              }
          }
        },
        tooltip: {
          formatter: (() => { const bind = this; return function(data) {
            const state = this.point.options.custom?.state || '';
            return bind.sanitizer.sanitize(SecurityContext.HTML,`${this.key} <br> ${state}`); };
          })()
        },
        accessibility: {
          point: {
            // Provide the same content as the tooltip for screen readers.
            descriptionFormatter: (() => { const bind = this; return function(point: any) {
              const stateName = point.options.custom?.state || '';
              return bind.sanitizer.sanitize(SecurityContext.HTML, `${point.name}. ${stateName}.`);
            }; })()
          }
        },
        series: [{
          data: dataSet
        }],

    } as Options);
      this.resizeChart();
      this.resizeObserver = new ResizeObserver(() => this.resizeChart());
      this.resizeObserver.observe(this.chartContainer.nativeElement.parentElement);
    }
  }

  getDataSet(): PointOptionsObject[] {
    const colors = {
      'badge-unknown': 'gray',
      'badge-ok': '#088105',
      'badge-warning': '#0075c9',
      'badge-error': '#E81123'
    };

    let data = [];

    if (this.upgradeDomains.length > 30) {
      const counter = new Counter();
      // easier to add to the counter as statename/class and then pull them back given these will always map to the same
      this.upgradeDomains.forEach(p => counter.add(p.stateName + '---' + p.badgeClass));
      data = counter.entries().map(entry => {
        const split = entry.key.toString().split('---');
        const stateName = split[0];
        const badgeClass = split[1];

        return {
          type: 'pie',
          name: stateName + ' : ' + entry.value,
          y: entry.value,
          color: colors[badgeClass as keyof typeof colors],
          custom: { state: stateName },
          dataLabels: {
            style: {
              fontSize: '15px',
              fontColor: '#fff'
            }
          }
        };
      });
    }else{
      data = this.upgradeDomains.map(p => {
        return {
          type: 'pie',
          name: p.prefix + p.name,
          y: 1,
          color: colors[p.badgeClass as keyof typeof colors],
          custom: { state: p.stateName },
          dataLabels: {
            style: {
                fontSize: '15px',
                fontColor: '#fff'
            }
        },
        };
      });
    }

    // if there is no data we want gray rings.
    // so we need to push a gray entry
    if (data.every(d => d.y === 0)) {
      data.push({
        type: 'pie',
        name: '',
        y: 1,
          color: 'gray',
          custom: { state: '' },
        dataLabels: {
          style: {
            fontSize: '20px',
            fontColor: '#fff'
        }
      },
      });
    }
    return data;
  }


  ngOnChanges() {
    if (this.chart){
      this.chart.series[0].setData(this.getDataSet(), true, this.experience.isNew() ? false : undefined);
    }else{
      const ref: Record<string, ITileCount> = {};
      ref[UpgradeDomainStateNames.Pending] = {
        name: UpgradeDomainStateNames.Pending,
        css: BadgeConstants.BadgeUnknown,
        uds: []
      };
      ref[UpgradeDomainStateNames.InProgress] = {
        name: UpgradeDomainStateNames.InProgress,
        css: 'blue',
        uds: []
      };
      ref[UpgradeDomainStateNames.Completed] = {
        name: UpgradeDomainStateNames.Completed,
        css: BadgeConstants.BadgeOK,
        uds: []
      };
      ref[UpgradeDomainStateNames.Failed] = {
        name: UpgradeDomainStateNames.Failed,
        css: BadgeConstants.BadgeError,
        uds: []
      };
      this.tiles = [
        ref[UpgradeDomainStateNames.Completed],
        ref[UpgradeDomainStateNames.InProgress],
        ref[UpgradeDomainStateNames.Pending],
        ref[UpgradeDomainStateNames.Failed],
      ];

      this.upgradeDomains.forEach(unit => {
        ref[unit.stateName].uds.push(unit);
      });
      if (this.showChart) { this.getDataSet(); }
    }
  }

}
