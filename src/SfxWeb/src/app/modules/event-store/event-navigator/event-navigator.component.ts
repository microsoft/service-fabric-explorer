import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, AfterViewInit, Output, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ITimelineData } from 'src/app/Models/eventstore/timelineGenerators';

interface NavigatorEvent {
  id: string | number;
  name: string;
  lane: string;
  start: number;
  end: number;
  color: string;
  facts: { name: string; value: string }[];
}

interface NavigatorTrack {
  name: string;
  height: number;
  count: number;
  marks: { event: NavigatorEvent; x: number; width: number; y: number; point: boolean }[];
}

@Component({
  selector: 'app-event-navigator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-navigator.component.html',
  styleUrls: ['./event-navigator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventNavigatorComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() events!: ITimelineData;
  @Input() inspectLabel = 'Open in event table';
  @Output() inspectEvent = new EventEmitter<string>();
  @ViewChild('plot') plot!: ElementRef<HTMLElement>;
  private readonly cdr = inject(ChangeDetectorRef);
  private observer?: ResizeObserver;
  private all: NavigatorEvent[] = [];
  private width = 800;
  private initialized = false;
  private queryStart?: number;
  private queryEnd?: number;
  private drag?: { id: number; x: number; start: number; end: number };
  private moved = false;
  public search = '';
  public utc = true;
  public selected?: NavigatorEvent;
  public tracks: NavigatorTrack[] = [];
  public ticks: { x: number; time: number }[] = [];
  public from = 0;
  public to = 1;
  public minimum = 0;
  public maximum = 1;
  public count = 0;
  public visibleCount = 0;
  public brush?: { x: number; width: number; from: number; to: number };
  public announcement = '';

  ngOnChanges() {
    const root = document.createElement('div');
    const plain = (value: string | HTMLElement | undefined) => {
      // Parse into an inert template. Never insert event-provided HTML into the page.
      const template = document.createElement('template');
      template.innerHTML = typeof value === 'string' ? value : value?.textContent || '';
      root.textContent = template.content.textContent || '';
      return root.textContent.trim();
    };
    const humanize = (value: string) => value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
    const lanes = new Map(this.events.groups?.get().map(group => [group.id, plain(group.content)]) || []);
    this.all = (this.events.items?.get() || []).map(item => {
      const start = +new Date(item.start);
      const end = Math.max(start, +new Date(item.end ?? item.start));
      const name = humanize(item.kind || '') || plain(item.content) || 'Event';
      const template = document.createElement('template');
      template.innerHTML = item.title || '';
      const facts: NavigatorEvent['facts'] = [];
      const extract = (table: Element, path: string[]) => {
        Array.from(table.querySelectorAll('tr')).filter(row => row.closest('table') === table).forEach(row => {
          const cells = Array.from(row.children).filter(cell => cell.tagName === 'TD');
          if (cells.length < 2) { return; }
          const key = humanize(cells[0].textContent?.trim() || '');
          const nextPath = key ? [...path, key] : path;
          const nested = Array.from(cells[1].querySelectorAll('table')).filter(child => child.parentElement?.closest('table') === table);
          if (nested.length) { nested.forEach(child => extract(child, nextPath)); }
          else {
            const value = (cells[1].textContent || '').trim().replace(/^:\s*/, '');
            if (nextPath.length && value) { facts.push({ name: nextPath.join(' / '), value }); }
          }
        });
      };
      Array.from(template.content.querySelectorAll('table')).filter(table => !table.parentElement?.closest('table')).forEach(table => extract(table, []));
      const context = template.content.querySelector('.inner-tooltip')?.firstChild?.textContent?.trim();
      if (context && !/^Start\b/i.test(context)) { facts.unshift({ name: 'Context', value: context }); }
      const color = /red|error/i.test(item.className || '') ? 'error' : /orange|yellow|warning/i.test(item.className || '') ? 'warning' : /green/i.test(item.className || '') ? 'success' : 'info';
      return { id: item.id, name, lane: lanes.get(item.group) || humanize(item.kind || '') || 'Events', start, end, color, facts };
    }).filter(item => Number.isFinite(item.start) && Number.isFinite(item.end)).sort((a, b) => a.start - b.start);
    const qStart = this.events.start?.getTime();
    const qEnd = this.events.end?.getTime();
    this.minimum = qStart ?? (this.all.length ? Math.min(...this.all.map(item => item.start)) - 30000 : Date.now() - 3600000);
    this.maximum = qEnd ?? (this.all.length ? Math.max(...this.all.map(item => item.end)) + 30000 : Date.now());
    this.maximum = Math.max(this.maximum, this.minimum + 1000);
    if (this.selected) {
      this.selected = this.all.find(item => item.id === this.selected!.id && item.start === this.selected!.start && item.name === this.selected!.name);
    }
    const changed = qStart !== this.queryStart || qEnd !== this.queryEnd;
    this.queryStart = qStart;
    this.queryEnd = qEnd;
    if (!this.initialized || changed) {
      this.focusEvents();
    } else {
      this.setWindow(this.from, this.to);
    }
    this.initialized = this.all.length > 0;
  }

  ngAfterViewInit() {
    this.observer = new ResizeObserver(entries => {
      this.width = Math.max(1, entries[0].contentRect.width);
      this.layout();
      this.cdr.markForCheck();
    });
    this.observer.observe(this.plot.nativeElement);
  }

  ngOnDestroy() { this.observer?.disconnect(); }

  private matches(item: NavigatorEvent): boolean {
    const query = this.search.trim().toLocaleLowerCase();
    return !query || `${item.name} ${item.lane} ${item.facts.map(fact => fact.value).join(' ')}`.toLocaleLowerCase().includes(query);
  }

  public filter() {
    if (this.selected && !this.matches(this.selected)) { this.selected = undefined; }
    this.layout();
  }

  private layout() {
    const filtered = this.all.filter(item => this.matches(item));
    this.count = filtered.length;
    this.visibleCount = 0;
    const rows = new Map<string, NavigatorEvent[]>();
    filtered.forEach(item => {
      const row = rows.get(item.lane) || [];
      row.push(item);
      rows.set(item.lane, row);
    });
    const span = this.to - this.from;
    this.tracks = Array.from(rows, ([name, items]) => {
      const ends: number[] = [];
      const marks: NavigatorTrack['marks'] = [];
      items.filter(item => item.end >= this.from && item.start <= this.to).forEach(event => {
        const point = event.end - event.start < 1000;
        const left = (Math.max(this.from, event.start) - this.from) / span * this.width;
        const right = (Math.min(this.to, event.end) - this.from) / span * this.width;
        const width = Math.min(this.width, Math.max(24, point ? 24 : right - left));
        const x = Math.max(0, Math.min(this.width - width, left - (point ? 12 : 0)));
        let slot = ends.findIndex(end => end + 6 <= x);
        if (slot < 0) { slot = ends.length; }
        ends[slot] = x + width;
        marks.push({ event, x, width, y: 9 + slot * 34, point });
        this.visibleCount++;
      });
      return { name, count: items.length, marks, height: Math.max(52, 18 + ends.length * 34) };
    });
    const tickCount = Math.max(2, Math.min(7, Math.floor(this.width / 160)));
    this.ticks = Array.from({ length: tickCount }, (_, i) => ({ x: i / (tickCount - 1) * 100, time: this.from + span * i / (tickCount - 1) }));
  }

  public setWindow(start: number, end: number) {
    const span = Math.min(this.maximum - this.minimum, Math.max(1000, end - start));
    this.from = Math.max(this.minimum, Math.min(this.maximum - span, start));
    this.to = this.from + span;
    this.layout();
  }

  public focusEvents() {
    const matches = this.all.filter(item => this.matches(item) && item.end >= this.minimum && item.start <= this.maximum);
    if (!matches.length) { this.setWindow(this.minimum, this.maximum); return; }
    const first = Math.min(...matches.map(item => item.start));
    const last = Math.max(...matches.map(item => item.end));
    const padding = Math.max(15000, (last - first) * 0.12);
    this.setWindow(first - padding, last + padding);
  }

  public zoom(factor: number) {
    const center = (this.from + this.to) / 2;
    const half = (this.to - this.from) * factor / 2;
    this.setWindow(center - half, center + half);
    this.announceWindow();
  }

  public pan(direction: number) {
    const shift = (this.to - this.from) * 0.5 * direction;
    this.setWindow(this.from + shift, this.to + shift);
    this.announceWindow();
  }

  public select(event: NavigatorEvent) {
    if (this.moved) { return; }
    this.selected = event;
    this.announcement = `${event.name}, ${this.timestamp(event.start, true)}`;
  }

  public timestamp(value: number, full = false): string {
    return new Intl.DateTimeFormat('en-GB', {
      ...(full ? { day: '2-digit', month: 'short', year: 'numeric' } as const : {}),
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      ...(this.utc ? { timeZone: 'UTC' } : {})
    }).format(new Date(value));
  }

  public duration(ms: number): string {
    if (ms < 1000) { return ms ? '<1 second' : 'Instant'; }
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) { return `${seconds} seconds`; }
    if (seconds < 3600) { return `${Math.floor(seconds / 60)}m ${seconds % 60}s`; }
    if (seconds < 86400) { return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m`; }
    return `${Math.floor(seconds / 86400)}d ${Math.floor(seconds % 86400 / 3600)}h`;
  }

  private announceWindow() { this.announcement = `Showing ${this.timestamp(this.from, true)} to ${this.timestamp(this.to, true)}`; }

  public key(event: KeyboardEvent) {
    if (event.key === 'Escape') { this.brush = undefined; this.drag = undefined; this.selected = undefined; }
    if (event.target !== event.currentTarget) { return; }
    if (event.key === 'ArrowLeft') { this.pan(-1); }
    else if (event.key === 'ArrowRight') { this.pan(1); }
    else if (event.key === '+' || event.key === '=') { this.zoom(0.5); }
    else if (event.key === '-') { this.zoom(2); }
    else if (event.key === 'Home') { this.focusEvents(); }
    else { return; }
    event.preventDefault();
    event.stopPropagation();
  }

  public pointerDown(event: PointerEvent) {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button') || !this.count) { return; }
    const rect = this.plot.nativeElement.getBoundingClientRect();
    this.moved = false;
    this.drag = { id: event.pointerId, x: Math.max(0, Math.min(this.width, event.clientX - rect.left)), start: this.from, end: this.to };
    this.plot.nativeElement.setPointerCapture(event.pointerId);
  }

  public pointerMove(event: PointerEvent) {
    if (!this.drag || this.drag.id !== event.pointerId) { return; }
    const x = Math.max(0, Math.min(this.width, event.clientX - this.plot.nativeElement.getBoundingClientRect().left));
    const left = Math.min(x, this.drag.x);
    const width = Math.abs(x - this.drag.x);
    if (width < 6) { return; }
    this.moved = true;
    this.brush = { x: left, width, from: this.drag.start + left / this.width * (this.drag.end - this.drag.start), to: this.drag.start + (left + width) / this.width * (this.drag.end - this.drag.start) };
  }

  public pointerUp(event: PointerEvent, cancel = false) {
    if (!this.drag || this.drag.id !== event.pointerId) { return; }
    if (this.brush && !cancel) { this.setWindow(this.brush.from, this.brush.to); this.announceWindow(); }
    this.brush = undefined;
    this.drag = undefined;
    if (this.plot.nativeElement.hasPointerCapture(event.pointerId)) { this.plot.nativeElement.releasePointerCapture(event.pointerId); }
    this.moved = false;
  }
}
