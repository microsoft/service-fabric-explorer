import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';
import { Chart, chart } from 'highcharts';
import { ReplicaOnPartition } from 'src/app/Models/DataModels/Replica';
import { IRawRemoteReplicatorStatus } from 'src/app/Models/RawDataTypes';
import { ITimedReplication } from '../replica-status-container/replica-status-container.component';

@Component({
  selector: 'app-replication-inspector',
  standalone: false,
  templateUrl: './replication-inspector.component.html',
  styleUrls: ['./replication-inspector.component.scss']
})
export class ReplicationInspectorComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() replica!: ReplicaOnPartition;
  @Input() replicator!: IRawRemoteReplicatorStatus;
  @Input() history: ITimedReplication[] = [];
  @Output() closed = new EventEmitter<void>();
  @ViewChild('plot') plot!: ElementRef<HTMLDivElement>;
  expanded = false;
  utc = false;
  acknowledgement: 'replication' | 'copy' = 'replication';
  points: [number, number][] = [];
  rawJson = '';
  private chart?: Chart;
  private observer?: ResizeObserver;

  ngOnChanges() {
    this.rawJson = JSON.stringify(this.replica?.raw, null, 2);
    this.points = [];
    for (let i = 1; i < this.history.length; i++) {
      const previous = this.history[i - 1];
      const current = this.history[i];
      const elapsed = (+current.date - +previous.date) / 1000;
      const rate = (+current.LastAppliedReplicationSequenceNumber - +previous.LastAppliedReplicationSequenceNumber) / elapsed;
      if (elapsed > 0 && Number.isFinite(rate) && rate >= 0) { this.points.push([+current.date, rate]); }
    }
    this.chart?.series[0].setData(this.points, true, false);
  }

  ngAfterViewInit() {
    const inspector = this;
    this.chart = chart(this.plot.nativeElement, {
      chart: { type: 'area', backgroundColor: 'transparent', animation: false, style: { fontFamily: 'inherit', fontSize: '15px' } },
      title: { text: '' }, credits: { enabled: false }, legend: { enabled: false },
      xAxis: { type: 'datetime', lineColor: '#30363d', tickColor: '#30363d', labels: {
        style: { color: '#8b949e', fontSize: '15px' }, formatter() { return inspector.formatTime(Number(this.value)); }
      } },
      yAxis: { min: 0, title: { text: 'LSN / sec', style: { color: '#8b949e' } }, gridLineColor: '#30363d', labels: { style: { color: '#8b949e', fontSize: '15px' } } },
      tooltip: { outside: false, backgroundColor: '#21262d', borderColor: '#484f58', style: { color: '#e6edf3', fontSize: '15px' }, formatter() {
        return `${inspector.formatTime(Number(this.x))}<br/>${Number(this.y).toFixed(2)} LSN / sec`;
      } },
      plotOptions: { series: { animation: false }, area: { fillOpacity: 0.12, marker: { enabled: false }, lineWidth: 2 } },
      series: [{ type: 'area', name: 'Replication rate', color: '#58a6ff', data: this.points }]
    });
    // Resize the chart to its actual box, including expand/collapse and sidebar changes.
    this.observer = new ResizeObserver(() => {
      const { width, height } = this.plot.nativeElement.getBoundingClientRect();
      if (width > 0 && height > 0) { this.chart?.setSize(width, height, false); }
    });
    this.observer.observe(this.plot.nativeElement);
  }

  formatTime(time: number): string {
    return new Date(time).toLocaleTimeString('en-GB', { hour12: false, ...(this.utc ? { timeZone: 'UTC' } : {}) });
  }

  setUTC(utc: boolean) {
    this.utc = utc;
    this.chart?.xAxis[0].update({}, true);
    this.chart?.tooltip.hide(0);
  }

  ngOnDestroy() { this.observer?.disconnect(); this.chart?.destroy(); }
}
