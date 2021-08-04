import { Component, OnInit, Input, ChangeDetectionStrategy, AfterViewInit, ViewChild, ElementRef, OnChanges } from '@angular/core';
import { UpgradeDomain } from 'src/app/Models/DataModels/Shared';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';
import { Chart, Options, chart, PointOptionsObject, SeriesPieOptions } from 'highcharts';

@Component({
  selector: 'app-upgrade-progress',
  templateUrl: './upgrade-progress.component.html',
  styleUrls: ['./upgrade-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpgradeProgressComponent implements OnInit, AfterViewInit, OnChanges {

  @Input() upgradeDomains: UpgradeDomain[];
  @Input() showChart = false;

  @ViewChild('chart') private chartContainer: ElementRef;

  chart: Chart;

  essentialItems: IEssentialListItem[] = [];

  ngOnInit() {
  }

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
          text: 'test',
          verticalAlign: 'middle',
          style: {
            color: '#1234',
            fontSize: '15pt'
          }
        },
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
            return `${this.key} <br> ${ud.stateName}`; };
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
      'badge-warning': '#0075c9'
    };

    const data = this.upgradeDomains.map(p => {
      return {
        type: 'pie',
        name: 'UD : ' + p.name,
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
    }
  }

}
