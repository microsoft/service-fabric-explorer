import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Chart, Options, chart, PointOptionsObject, SeriesPieOptions } from 'highcharts';
import { Utils } from 'src/app/Utils/Utils';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';
import { IVisEvent } from '../../event-store/event-store/event-store.component';

@Component({
  selector: 'app-rca-overview',
  templateUrl: './rca-overview.component.html',
  styleUrls: ['./rca-overview.component.scss']
})
export class RcaOverviewComponent implements OnInit {
  @Input() type: string;
  @Input() events: IVisEvent[];

  @ViewChild('chart') private chartContainer: ElementRef;
  private chart: Chart;
  private preGeneratedColors = ['#2f7ed8', '#0d233a', '#8bbc21', '#910000', '#1aadce',
  '#492970', '#f28f43', '#77a1e5', '#a6c96a'];


  public options: Options = {
    chart: {
      type: 'pie',
      backgroundColor: null,
      borderRadius: 0,
      spacingTop: 0,
      spacingBottom: 0,
      spacingLeft: 0,
      spacingRight: 0,
      height: 150,
      width: 150
    },
    title: {
      text: '',
    },
    exporting: {
      enabled: false
    },
    tooltip: {
      enabled: true,
      outside: true
    },
    credits: { enabled: false },
    loading: {
      showDuration: 0
    },
    plotOptions: {
      pie: {
        borderWidth: 2,
        innerSize: '50%',
        borderColor: '#262626',
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
            enabled: false
        },
        showInLegend: false
      },
      series: {}
    }
  };

  colorKey: Record<string, string> = {};
  reasons: IEssentialListItem[] = [];

  constructor() { }

  ngAfterViewInit() {
    const dataSet: PointOptionsObject[] = this.reasons.map(item => {
      return {
        y: +item.displayText,
        name: item.descriptionName,
        type: 'pie',
        dataLabels: {
          style: {
            fontSize: '10px',
            fontColor: '#fff'
        }},
        color: this.colorKey[item.descriptionName]
      }
    })
    this.options.series = [{ data: dataSet, type: 'pie' }]
    this.chart = chart(this.chartContainer.nativeElement, this.options);
  }

  ngOnInit(): void {
    const grouped = Object.entries(Utils.groupByFunc(this.events, item =>{
      if(item.visEvent?.related?.length > 0 && item.visEvent.related[0].name !== "self") {
        return item.visEvent.related[0].kind;
      }else if(item.visEvent.reasonForEvent) {
        return item.visEvent.reasonForEvent ;
      }else{
        return 'unknown'
      }
    }));
    this.reasons = grouped.sort((a,b) => b[1].length - a[1].length).map(reason => {
      this.colorKey[reason[0]] = this.colorKey[reason[0]] || this.preGeneratedColors.pop();
      console.log(reason[1])
      return {
        displayText: reason[1].length.toString(),
        copyTextValue: reason[0] + ' ' + reason[1].length.toString(),
        descriptionName: reason[0],
        displaySelector: true
      }
    })

    console.log(this.reasons)
  }

  ngOnChanges(): void {
    if (this.chart) {
      console.log("test")
      this.chart.series[0].setData(this.reasons.map(item => {
        return {
          y: +item.displayText,
          name: item.descriptionName,
          color: Utils.randomColor()
        }
      }));
    }
  }
}
