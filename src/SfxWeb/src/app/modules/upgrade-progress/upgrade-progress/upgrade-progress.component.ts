import { Component, Input, ChangeDetectionStrategy, AfterViewInit, ViewChild, ElementRef, OnChanges, SecurityContext } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpgradeProgressComponent implements AfterViewInit, OnChanges {

  @Input() upgradeDomains: UpgradeDomain[];
  @Input() showChart = false;

  @ViewChild('chart') private chartContainer: ElementRef;

  chart: Chart;

  tiles: ITileCount[] = [];
  displayUd: UpgradeDomain[] = [];

  constructor(private sanitizer: DomSanitizer) {}

  ngAfterViewInit() {
    if (this.showChart) {
      const dataSet = this.getDataSet();
      this.chart = chart(this.chartContainer.nativeElement, {
        chart: {
            type: 'pie',
            width: 350,
            height: 300,
            backgroundColor: null,
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
                borderWidth: 2,
                innerSize: '50%',
                borderColor:  '#262626'
            },
            series: {
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
            const ud = bind.upgradeDomains[this.point.index];
            return bind.sanitizer.sanitize(SecurityContext.HTML,`${this.key} <br> ${ud.stateName}`); };
          })()
        },
        series: [{
          data: dataSet
        }],

    } as Options);
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
          color: colors[badgeClass],
          dataLabels: {
            style: {
              fontSize: '13px',
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
          color: colors[p.badgeClass],
          dataLabels: {
            style: {
                fontSize: '13px',
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
      this.chart.series[0].setData(this.getDataSet());
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
    }
  }

}
