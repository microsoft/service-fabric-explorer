import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, HostListener, ElementRef, ViewChild, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import type { IEventStoreData } from '../event-store/event-store.component';
import type { IOptionConfig, IOptionData } from '../option-picker/option-picker.component';

@Component({
  selector: 'app-event-query-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-query-bar.component.html',
  styleUrls: ['./event-query-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventQueryBarComponent implements OnChanges, OnDestroy {
  @Input() minimum!: Date;
  @Input() start?: Date;
  @Input() end?: Date;
  @Input() config?: IOptionConfig;
  @Input() selectedSources: IEventStoreData<any, any>[] = [];
  @Output() rangeChange = new EventEmitter<{ startDate: Date; endDate: Date }>();
  @Output() sourceChange = new EventEmitter<IOptionData>();
  @ViewChild('rangeButton') rangeButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('sourcesButton') sourcesButton?: ElementRef<HTMLButtonElement>;
  private host = inject(ElementRef<HTMLElement>);
  private data = inject(DataService);
  private settings = inject(SettingsService);
  private cdr = inject(ChangeDetectorRef);
  private subscriptions = new Subscription();
  private repairRequested = false;
  private repairSource?: IEventStoreData<any, any>;
  private lastPreset?: { hours: number; start: number; end: number };
  public panel: 'range' | 'sources' | null = null;
  public custom = false;
  public utc = true;
  public draftStart = '';
  public draftEnd = '';
  public error = '';
  public sources: IEventStoreData<any, any>[] = [];
  public presets = [
    { label: 'Last 15 minutes', hours: 0.25 },
    { label: 'Last hour', hours: 1 },
    { label: 'Last 6 hours', hours: 6 },
    { label: 'Last 24 hours', hours: 24 },
    { label: 'Last 7 days', hours: 168 }
  ];

  ngOnChanges() {
    this.updateSources();
    if (this.config?.enableRepairTasks && !this.repairRequested) {
      this.repairRequested = true;
      this.subscriptions.add(this.data.clusterManifest.ensureInitialized().subscribe(() => {
        if (!this.data.clusterManifest.isRepairManagerEnabled) { return; }
        this.subscriptions.add(this.data.repairCollection.ensureInitialized().subscribe(() => {
          this.repairSource = this.data.getRepairTasksData(this.settings);
          this.updateSources();
          this.cdr.markForCheck();
        }));
      }));
    }
  }

  ngOnDestroy() { this.subscriptions.unsubscribe(); }

  private updateSources() {
    this.sources = [];
    if (this.config?.enableCluster) { this.sources.push(this.data.getClusterEventData()); }
    if (this.config?.enableNodes) { this.sources.push(this.data.getNodeEventData()); }
    if (this.config?.enableApplication) { this.sources.push(this.data.getApplicationEventData()); }
    if (this.config?.enableRepairTasks && this.repairSource) { this.sources.push(this.repairSource); }
  }

  public get label(): string {
    if (this.lastPreset && this.start && this.end && +this.start === this.lastPreset.start && +this.end === this.lastPreset.end) {
      return this.presets.find(preset => preset.hours === this.lastPreset!.hours)!.label;
    }
    return 'Time range';
  }

  public get sourceCount(): number { return this.sources.filter(source => this.isSelected(source)).length; }
  public isSelected(source: IEventStoreData<any, any>): boolean {
    return this.selectedSources.some(selected => selected.displayName === source.displayName);
  }

  public toggleSource(source: IEventStoreData<any, any>, event: Event) {
    this.sourceChange.emit({ data: source, addToList: (event.target as HTMLInputElement).checked });
  }

  public format(date?: Date): string {
    if (!date) { return ''; }
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      ...(this.utc ? { timeZone: 'UTC' } : {})
    }).format(date);
  }

  public toggle(panel: 'range' | 'sources') {
    this.panel = this.panel === panel ? null : panel;
    this.custom = false;
    this.error = '';
  }

  public close(restoreFocus = false) {
    const panel = this.panel;
    this.panel = null;
    this.error = '';
    if (restoreFocus) { (panel === 'sources' ? this.sourcesButton : this.rangeButton)?.nativeElement.focus(); }
  }

  @HostListener('document:click', ['$event'])
  outside(event: MouseEvent) {
    // The preset list may be replaced by the custom form before this event bubbles.
    if (!event.composedPath().includes(this.host.nativeElement)) { this.close(); }
  }

  @HostListener('keydown.escape', ['$event'])
  escape(event: Event) { if (this.panel) { event.stopPropagation(); this.close(true); } }

  public applyPreset(hours: number) {
    const end = new Date();
    const start = new Date(Math.max(+this.minimum, +end - hours * 3600000));
    if (start >= end) { this.error = 'No history is available for this range.'; return; }
    this.lastPreset = { hours, start: +start, end: +end };
    // A clamped interval must not claim to be the full preset duration.
    if (+end - +start !== hours * 3600000) { this.lastPreset = undefined; }
    this.rangeChange.emit({ startDate: start, endDate: end });
    this.close(true);
  }

  private inputValue(date: Date): string {
    const value = this.utc ? date : new Date(+date - date.getTimezoneOffset() * 60000);
    return value.toISOString().slice(0, 19);
  }

  public openCustom() {
    this.custom = true;
    this.error = '';
    this.draftStart = this.inputValue(this.start || this.minimum);
    this.draftEnd = this.inputValue(this.end || new Date());
  }

  public changeZone(utc: boolean) {
    this.utc = utc;
    // Zone selection is a display preference, not a new query.
  }

  public applyCustom() {
    const parse = (text: string) => new Date(text + (this.utc ? 'Z' : ''));
    const start = parse(this.draftStart);
    const end = parse(this.draftEnd);
    if (!this.draftStart || !this.draftEnd || !Number.isFinite(+start) || !Number.isFinite(+end)) {
      this.error = 'Enter a valid start and end date.';
    } else if (start >= end) {
      this.error = 'End must be after start.';
    } else if (start < this.minimum) {
      this.error = `Available history starts ${this.format(this.minimum)}.`;
    } else if (+end > Date.now()) {
      this.error = 'End cannot be in the future.';
    } else {
      this.lastPreset = undefined;
      this.rangeChange.emit({ startDate: start, endDate: end });
      this.close(true);
    }
  }
}
