import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { TimeUtils } from 'src/app/Utils/TimeUtils';

@Component({
  selector: 'app-repair-duration',
  standalone: false,
  templateUrl: './repair-duration.component.html',
  styleUrls: ['./repair-duration.component.scss']
})
export class RepairDurationComponent implements OnChanges {
  @Input() jobs: RepairTask[] = [];
  @Output() inspectJob = new EventEmitter<string>();
  readonly phases = ['Preparing', 'Executing', 'Restoring'];
  query = '';
  order = 'longest';
  page = 1;
  readonly pageSize = 12;
  rows: { id: string; action: string; state: string; phases: { name: string; duration: number | null }[]; total: number }[] = [];
  maximum = 1;
  get pages() { return Math.max(1, Math.ceil(this.rows.length / this.pageSize)); }
  get visible() { return this.rows.slice((this.page - 1) * this.pageSize, this.page * this.pageSize); }

  ngOnChanges() { this.update(); }

  update(reset = false) {
    const query = this.query.trim().toLowerCase();
    this.rows = this.jobs.filter(job => !query || `${job.id} ${job.raw.Action} ${job.raw.State}`.toLowerCase().includes(query)).map(job => {
      const phases = this.phases.map(name => {
        const phase = job.getHistoryPhase(name);
        const duration = phase?.durationMilliseconds;
        return { name, duration: typeof duration === 'number' && Number.isFinite(duration) && duration >= 0 ? duration : null };
      });
      return { id: job.id, action: job.raw.Action, state: job.raw.State, phases, total: phases.reduce((sum, phase) => sum + (phase.duration ?? 0), 0) };
    });
    if (this.order !== 'table') { this.rows.sort((a, b) => this.order === 'shortest' ? a.total - b.total : b.total - a.total); }
    this.maximum = this.rows.reduce((max, row) => Math.max(max, row.total), 1);
    this.page = reset ? 1 : Math.min(this.page, this.pages);
  }

  duration(value: number | null) { return value === null ? 'Unavailable' : value === 0 ? '0 seconds' : TimeUtils.getDuration(value); }
}
