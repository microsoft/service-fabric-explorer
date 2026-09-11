import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, AfterViewInit, Output, ViewChild, ViewChildren, QueryList, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { SelectMenuComponent } from 'src/app/shared/component/select-menu/select-menu.component';
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
  marks: NavigatorMark[];
}

interface NavigatorMark {
  event: NavigatorEvent;
  events: NavigatorEvent[];
  x: number;
  width: number;
  y: number;
  point: boolean;
  color: string;
}

@Component({
  selector: 'app-event-navigator',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectMenuComponent],
  templateUrl: './event-navigator.component.html',
  styleUrls: ['./event-navigator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventNavigatorComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() events!: ITimelineData;
  @Input() heading = 'Event navigator';
  @Input() trackDescriptions: Record<string, string> = {};
  @Input() inspectLabel = 'Open in event table';
  @Output() inspectEvent = new EventEmitter<string>();
  @ViewChild('plot') plot!: ElementRef<HTMLElement>;
  @ViewChild('timeline') timeline!: ElementRef<HTMLElement>;
  @ViewChildren('labelText') labelTexts!: QueryList<ElementRef<HTMLElement>>;
  public expandedLabels = new Set<string>();
  private labelHeights = new Map<string, number>();
  private labelObserver?: ResizeObserver;
  private labelChanges?: Subscription;

  public toggleLabel(name: string) {
    if (this.expandedLabels.has(name)) { this.expandedLabels.delete(name); }
    else { this.expandedLabels.add(name); }
    this.layout();
  }
  private readonly cdr = inject(ChangeDetectorRef);
  private observer?: ResizeObserver;
  private all: NavigatorEvent[] = [];
  private width = 800;
  private initialized = false;
  private queryStart?: number;
  private queryEnd?: number;
  private drag?: { id: number; x: number; start: number; end: number };
  private moved = false;
  private panelDrag?: { id: number; x: number; width: number; percent: number };
  public timelinePercent = 60;
  public search = '';
  public utc = true;
  public selected?: NavigatorEvent;
  public selectedGroup: NavigatorEvent[] = [];
  public groupPage = 0;
  public readonly groupPageSize = 20;

  public get groupPages(): number { return Math.ceil(this.selectedGroup.length / this.groupPageSize); }
  public get groupStart(): number { return Math.min(...this.selectedGroup.map(event => event.start)); }
  public get groupEnd(): number { return Math.max(...this.selectedGroup.map(event => event.end)); }
  public get groupSeverity(): string {
    return ['error', 'warning', 'info', 'success'].map(tone => {
      const count = this.selectedGroup.filter(event => event.color === tone).length;
      return count ? `${count} ${tone}` : '';
    }).filter(Boolean).join(' · ');
  }
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
  public timelineHeight?: number;

  ngOnChanges() {
    const plain = (value: string | HTMLElement | undefined) => {
      // DOM content is already decoded text and must not be parsed as HTML again.
      if (typeof value !== 'string') { return value?.textContent?.trim() || ''; }
      // Parse HTML strings once in an inert template; never insert them into the page.
      const template = document.createElement('template');
      template.innerHTML = value;
      return template.content.textContent?.trim() || '';
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
    if (this.selectedGroup.length) {
      this.selectedGroup = this.selectedGroup.map(previous => this.all.find(event => event.id === previous.id && event.start === previous.start && event.name === previous.name)).filter((event): event is NavigatorEvent => !!event && this.matches(event));
      this.groupPage = Math.min(this.groupPage, Math.max(0, this.groupPages - 1));
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
    this.labelObserver = new ResizeObserver(entries => {
      entries.forEach(entry => this.labelHeights.set((entry.target as HTMLElement).dataset.track!, entry.contentRect.height + 20));
      this.layout();
      this.cdr.markForCheck();
    });
    const observeLabels = () => {
      this.labelObserver!.disconnect();
      this.labelTexts.forEach(label => this.labelObserver!.observe(label.nativeElement));
    };
    observeLabels();
    this.labelChanges = this.labelTexts.changes.subscribe(observeLabels);
    this.observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === this.plot.nativeElement) {
          this.width = Math.max(1, entry.contentRect.width);
          this.layout();
        }
      }
      this.timelineHeight = this.timeline.nativeElement.getBoundingClientRect().height;
      this.cdr.markForCheck();
    });
    this.observer.observe(this.plot.nativeElement);
    this.observer.observe(this.timeline.nativeElement);
  }

  ngOnDestroy() { this.observer?.disconnect(); this.labelObserver?.disconnect(); this.labelChanges?.unsubscribe(); }

  private matches(item: NavigatorEvent): boolean {
    const query = this.search.trim().toLocaleLowerCase();
    return !query || `${item.name} ${item.lane} ${item.facts.map(fact => fact.value).join(' ')}`.toLocaleLowerCase().includes(query);
  }

  public filter() {
    if (this.selected && !this.matches(this.selected)) { this.selected = undefined; }
    this.selectedGroup = this.selectedGroup.filter(event => this.matches(event));
    this.groupPage = 0;
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
      const marks: NavigatorTrack['marks'] = [];
      const candidates = items.filter(item => item.end >= this.from && item.start <= this.to).map(event => {
        const point = event.end - event.start < 1000;
        const left = (Math.max(this.from, event.start) - this.from) / span * this.width;
        const right = (Math.min(this.to, event.end) - this.from) / span * this.width;
        const width = Math.min(this.width, Math.max(24, point ? 24 : right - left));
        const x = Math.max(0, Math.min(this.width - width, left - (point ? 12 : 0)));
        return { event, events: [event], x, width, y: 12, point, color: event.color };
      }).sort((a, b) => a.x - b.x);
      this.visibleCount += candidates.length;
      const severity: Record<string, number> = { success: 0, info: 1, warning: 2, error: 3 };
      // Merge visual collisions, including collisions introduced by a wider count label.
      // Original timestamps and event records stay unchanged.
      candidates.forEach(candidate => {
        let mark: NavigatorMark = candidate;
        while (marks.length && marks[marks.length - 1].x + marks[marks.length - 1].width + 6 > mark.x) {
          const previous = marks.pop()!;
          const events = previous.events.concat(mark.events);
          const width = Math.min(this.width, Math.max(previous.width, mark.x + mark.width - previous.x, 20 + String(events.length).length * 9));
          mark = {
            event: previous.event, events, width, x: Math.max(0, Math.min(previous.x, this.width - width)), y: 12, point: false,
            color: severity[previous.color] >= severity[mark.color] ? previous.color : mark.color
          };
        }
        marks.push(mark);
      });
      // Pairs remain directly selectable, even at identical timestamps.
      const individualMarks = new Map(candidates.map(candidate => [candidate.event, candidate]));
      const displayMarks: NavigatorMark[] = [];
      let hasPair = false;
      marks.forEach(mark => {
        if (mark.events.length === 2) {
          hasPair = true;
          mark.events.forEach((event, index) => {
            displayMarks.push({ ...individualMarks.get(event)!, y: 12 + index * 34 });
          });
        } else {
          displayMarks.push(mark);
        }
      });
      // Reserve space for focus rings at both plot edges, including merged groups.
      const inset = Math.min(4, this.width / 4);
      displayMarks.forEach(mark => {
        mark.width = Math.min(mark.width, this.width - inset * 2);
        mark.x = Math.max(inset, Math.min(mark.x, this.width - inset - mark.width));
      });
      return { name, count: items.length, marks: displayMarks, height: Math.max(hasPair ? 90 : 56, this.expandedLabels.has(name) ? this.labelHeights.get(name) || 56 : 56) };
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

  public selectMark(mark: NavigatorMark) {
    if (this.moved) { return; }
    this.selected = undefined;
    this.selectedGroup = [];
    this.groupPage = 0;
    if (mark.events.length === 1) { this.select(mark.event); }
    else {
      this.selectedGroup = [...mark.events].sort((a, b) => a.start - b.start);
      this.announcement = `${mark.events.length} events in ${mark.event.lane}`;
    }
  }

  public markChosen(mark: NavigatorMark): boolean {
    return this.selected ? mark.events.some(event => event.id === this.selected!.id) : this.selectedGroup.length > 0 && mark.events.some(event => event.id === this.selectedGroup[0].id);
  }

  public closeInspector() { this.selected = undefined; this.selectedGroup = []; }

  public zoomToGroup() {
    const padding = Math.max(500, (this.groupEnd - this.groupStart) * 0.15);
    this.setWindow(this.groupStart - padding, this.groupEnd + padding);
    this.announceWindow();
  }

  public entity(event: NavigatorEvent): string {
    return event.facts.find(fact => /(?:node|application|service|partition|replica|entity).*?(?:name|id)|context/i.test(fact.name))?.value || String(event.id);
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
    if (event.key === 'Escape') { this.brush = undefined; this.drag = undefined; this.closeInspector(); }
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

  public resizePanels(event: PointerEvent) {
    const handle = event.currentTarget as HTMLElement;
    if (event.type === 'pointerdown') {
      if (event.button !== 0) { return; }
      this.panelDrag = { id: event.pointerId, x: event.clientX, width: handle.parentElement!.clientWidth, percent: this.timelinePercent };
      handle.setPointerCapture(event.pointerId);
      handle.focus({ preventScroll: true });
      event.preventDefault();
    } else if (this.panelDrag?.id === event.pointerId) {
      if (event.type === 'pointermove') {
        this.timelinePercent = Math.max(40, Math.min(70, this.panelDrag.percent + (event.clientX - this.panelDrag.x) / this.panelDrag.width * 100));
      } else {
        this.panelDrag = undefined;
        if (handle.hasPointerCapture(event.pointerId)) { handle.releasePointerCapture(event.pointerId); }
      }
    }
  }

  public resizePanelsKey(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') { this.timelinePercent = Math.max(40, this.timelinePercent - 2); }
    else if (event.key === 'ArrowRight') { this.timelinePercent = Math.min(70, this.timelinePercent + 2); }
    else if (event.key === 'Home') { this.timelinePercent = 40; }
    else if (event.key === 'End') { this.timelinePercent = 70; }
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
