import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { IEventStoreData } from '../event-store/event-store.component';

interface EventRow {
  key: string;
  id: string;
  type: string;
  category: string;
  entity: string;
  time: string;
  json: string;
}

@Component({
  selector: 'app-event-results', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './event-results.component.html', styleUrls: ['./event-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventResultsComponent implements OnChanges, OnDestroy {
  private host: ElementRef<HTMLElement> = inject(ElementRef);
  private focusTimer?: ReturnType<typeof setTimeout>;
  private cdr = inject(ChangeDetectorRef);
  @Input() sources: IEventStoreData<any, any>[] = [];
  @Input() version = 0;
  @Input() refreshing = false;
  @Input() selectedId = '';
  @Input() selectionVersion = 0;
  public active = '';
  public query = '';
  public category = '';
  public utc = true;
  public sort: 'time' | 'type' | 'category' = 'time';
  public descending = true;
  public page = 1;
  public pageSize = 25;
  public expanded = new Set<string>();
  public rows: EventRow[] = [];
  public filtered: EventRow[] = [];
  public categories: string[] = [];
  public copyStatus = '';

  public get source() { return this.sources.find(source => source.displayName === this.active); }
  public get loading(): boolean { return !!this.source?.eventsList.isRefreshing; }
  public get failed(): boolean { return !!this.source && !this.loading && this.source.eventsList.lastRefreshWasSuccessful === false; }
  public get pages(): number { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
  public get visible(): EventRow[] { return this.filtered.slice((this.page - 1) * this.pageSize, this.page * this.pageSize); }

  ngOnChanges(changes: SimpleChanges) {
    const opening = (changes.selectedId || changes.selectionVersion) && this.selectedId;
    if (!this.source) { this.active = this.sources[0]?.displayName || ''; }
    if (opening) {
      const source = this.sources.find(item => this.normalize(item).some(row => row.id === this.selectedId));
      if (source) { this.active = source.displayName; this.query = this.selectedId; this.category = ''; this.page = 1; }
    }
    this.refreshRows();
    if (opening) {
      this.filtered.filter(row => row.id === this.selectedId).forEach(row => this.expanded.add(row.key));
      clearTimeout(this.focusTimer);
      this.focusTimer = setTimeout(() => {
        const row = this.host.nativeElement.querySelector<HTMLElement>('tr.selected .row-toggle');
        row?.scrollIntoView({ block: 'center' });
        row?.focus({ preventScroll: true });
      });
    }
  }

  ngOnDestroy() { clearTimeout(this.focusTimer); }

  private normalize(source: IEventStoreData<any, any>): EventRow[] {
    return (source.eventsList.collection || []).map((row: any, index: number) => {
      const repair = source.type === 'RepairTask';
      const model = repair ? row : row.raw;
      const raw = model?.raw || {};
      const type = repair ? raw.TaskId || 'Repair task' : model?.kind || raw.Kind || 'Event';
      const id = String(model?.eventInstanceId || raw.EventInstanceId || raw.TaskId || '');
      const time = model?.timeStamp || raw.TimeStamp || raw.History?.CreatedUtcTimestamp || '';
      return {
        key: `${id}:${time}:${index}`, id, type,
        category: repair ? raw.State || 'Repair task' : model?.category || raw.Category || 'Operational',
        entity: raw.NodeName || raw.ApplicationId || raw.ServiceId || raw.PartitionId || (repair ? raw.Action : '') || '',
        time, json: JSON.stringify(raw, null, 2)
      };
    });
  }

  private refreshRows() {
    this.rows = this.source ? this.normalize(this.source) : [];
    this.categories = Array.from(new Set(this.rows.map(row => row.category))).sort();
    if (this.category && !this.categories.includes(this.category)) { this.category = ''; }
    this.expanded = new Set(Array.from(this.expanded).filter(key => this.rows.some(row => row.key === key)));
    this.filter(false);
  }

  public selectSource(name: string) {
    this.active = name; this.page = 1; this.category = ''; this.expanded.clear(); this.refreshRows();
  }

  public filter(reset = true) {
    if (reset) { this.page = 1; }
    const words = this.query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
    this.filtered = this.rows.filter(row => (!this.category || row.category === this.category) && words.every(word => `${row.type} ${row.category} ${row.entity} ${row.id} ${row.json}`.toLocaleLowerCase().includes(word)));
    this.filtered.sort((a, b) => {
      const comparison = this.sort === 'time' ? (Date.parse(a.time) || 0) - (Date.parse(b.time) || 0) : a[this.sort].localeCompare(b[this.sort]);
      return this.descending ? -comparison : comparison;
    });
    this.page = Math.min(this.page, this.pages);
  }

  public order(column: 'time' | 'type' | 'category') {
    this.descending = this.sort === column ? !this.descending : column === 'time';
    this.sort = column; this.filter();
  }

  public toggle(row: EventRow) { this.expanded.has(row.key) ? this.expanded.delete(row.key) : this.expanded.add(row.key); }
  public clear() { this.query = ''; this.category = ''; this.filter(); }
  public humanize(value: string) { return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2'); }
  public timestamp(value: string) {
    if (!Number.isFinite(Date.parse(value))) { return 'Unavailable'; }
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, ...(this.utc ? { timeZone: 'UTC' } : {}) }).format(new Date(value));
  }

  public async copy(row: EventRow) {
    try { await navigator.clipboard.writeText(row.json); this.copyStatus = 'Event JSON copied.'; }
    catch { this.copyStatus = 'Clipboard unavailable. Select the JSON below to copy it.'; }
    this.cdr.markForCheck();
  }

  public exportCsv() {
    const cell = (value: string) => `"${value.replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`;
    const csv = [['Type', 'Category', 'Entity', 'Timestamp (UTC)', 'Event ID'], ...this.filtered.map(row => [row.type, row.category, row.entity, row.time, row.id])].map(row => row.map(cell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `events-${this.active.replace(/[^a-z0-9_-]/gi, '-')}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
