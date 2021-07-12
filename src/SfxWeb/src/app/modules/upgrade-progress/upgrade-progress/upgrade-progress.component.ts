import { Component, OnInit, Input, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { UpgradeDomain } from 'src/app/Models/DataModels/Shared';
import { Chart, Options, chart, PointOptionsObject, SeriesPieOptions } from 'highcharts';

@Component({
  selector: 'app-upgrade-progress',
  templateUrl: './upgrade-progress.component.html',
  styleUrls: ['./upgrade-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpgradeProgressComponent implements OnInit, AfterViewInit {

  @Input() upgradeDomains: UpgradeDomain[];

  @ViewChild('chart') private chartContainer: ElementRef;

  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    const dataSet = this.getDataSet();
    chart(this.chartContainer.nativeElement, {
      chart: {
          type: 'pie',
          width: 250,
          height: 250,
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
              borderWidth: 5,
              innerSize: '70%',
              borderColor: "rgba(0, 0, 0, 1)"
          }
      },
  
      series: [{
        data: dataSet
      }]
  } as Options);
  }

  getDataSet(): PointOptionsObject[] {
    const colors = {
      "badge-unknown": '#7FBA00',
      "badge-ok": '#088105',
      "badge-warning": '#E81123'
    };

    const data = this.upgradeDomains.map(p => {
      return {
        name: p.name,
        y: 1,
        color: colors[p.badgeClass]
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
}
