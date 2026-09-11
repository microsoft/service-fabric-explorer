import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, OnDestroy, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { RestClientService } from 'src/app/services/rest-client.service';
import { SelectMenuComponent } from 'src/app/shared/component/select-menu/select-menu.component';

interface PartitionChoice { id: string; name: string; }

@Component({
  selector: 'app-partition-picker', standalone: true, imports: [CommonModule, FormsModule, SelectMenuComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<div class="partition-picker">
    <div class="choices">
      <label>Application<app-select-menu label="Partition application" [value]="application" (valueChange)="chooseApplication($event)" [disabled]="loadingApplications" [options]="choices(applications, 'Choose an application')"></app-select-menu></label>
      <label [class.unavailable]="!application || loadingServices">Service<app-select-menu label="Partition service" [value]="service" (valueChange)="chooseService($event)" [disabled]="!application || loadingServices" [options]="choices(services, !application ? 'Select an application first' : loadingServices ? 'Loading services...' : 'Choose a service')"></app-select-menu></label>
      <label [class.unavailable]="!service || loadingPartitions">Partition<app-select-menu label="Choose partition" [(value)]="partition" [disabled]="!service || loadingPartitions" [options]="choices(partitions, !service ? 'Select a service first' : loadingPartitions ? 'Loading partitions...' : 'Choose a partition')"></app-select-menu></label>
      <button type="button" class="load" [disabled]="!partition || loadingPartitions" (click)="partitionChosen.emit(partition)">Load operations</button>
    </div>
    @if (loadingApplications || loadingServices || loadingPartitions) { <p role="status">Loading {{loadingApplications ? 'applications' : loadingServices ? 'services' : 'partitions'}}...</p> }
    @else if (error) { <p role="alert">{{error}} <button type="button" class="retry" (click)="retry()">Retry</button></p> }
    @else if (service && !partitions.length) { <p role="status">No partitions were returned for this service. You can enter a partition ID instead.</p> }
    @else if (application && !services.length) { <p role="status">No services were returned for this application.</p> }
  </div>`,
   styles: [`
     :host { display: block; min-width: 0; container: partition-choices / inline-size; }
     .partition-picker { width: 100%; min-width: 0; }
     .choices { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) auto; align-items: end; gap: 12px; }
     .choices label { display: grid; gap: 6px; font-size: 15px; min-width: 0; margin: 0; }
     .choices app-select-menu { display: block; width: 100%; min-width: 0; }
     select { box-sizing: border-box; width: 100%; min-width: 0; height: 40px; background: #0d1117; color: #e6edf3; border: 1px solid #484f58; border-radius: 6px; padding: 8px; font-size: 15px; text-overflow: ellipsis; }
     p { font-size: 15px; color: #8b949e; margin: 12px 0 0; }
     button { font-size: 15px; cursor: pointer; }
     .load { background: #238636; color: #fff; border: 1px solid #2ea043; padding: 8px 14px; border-radius: 6px; height: 40px; margin: 0; white-space: nowrap; }
     .load:disabled { opacity: .5; cursor: default; }
     .retry { color: #58a6ff; background: transparent; border: 0; }
     button:focus-visible, select:focus-visible { outline: 2px solid #58a6ff; outline-offset: 2px; }
     @container partition-choices (max-width: 760px) { .choices { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
     @container partition-choices (max-width: 400px) { .choices { grid-template-columns: minmax(0, 1fr); }.load { justify-self: start; } }
   `]
})
export class PartitionPickerComponent implements OnInit, OnDestroy {
  choices(items: PartitionChoice[], placeholder: string) { return [{ value: '', label: placeholder }, ...items.map(item => ({ value: item.id, label: item.name }))]; }
  @Output() partitionChosen = new EventEmitter<string>();
  private rest = inject(RestClientService);
  private applicationRequest?: Subscription;
  private serviceRequest?: Subscription;
  private partitionRequest?: Subscription;
  applications: PartitionChoice[] = [];
  services: PartitionChoice[] = [];
  partitions: PartitionChoice[] = [];
  application = '';
  service = '';
  partition = '';
  loadingApplications = false;
  loadingServices = false;
  loadingPartitions = false;
  error = '';
  ngOnInit() { this.loadApplications(); }
  ngOnDestroy() { this.applicationRequest?.unsubscribe(); this.serviceRequest?.unsubscribe(); this.partitionRequest?.unsubscribe(); }
  loadApplications() {
    this.applicationRequest?.unsubscribe(); this.loadingApplications = true; this.error = '';
    this.applicationRequest = this.rest.getApplications(true).pipe(finalize(() => this.loadingApplications = false)).subscribe({
      next: items => {
        this.applications = items.map(item => ({ id: item.Id, name: item.Name }));
        if (!this.applications.some(item => item.id === 'System')) { this.applications.unshift({ id: 'System', name: 'fabric:/System' }); }
      }, error: () => this.error = 'Could not load applications.'
    });
  }
  chooseApplication(value: string) {
    this.serviceRequest?.unsubscribe(); this.partitionRequest?.unsubscribe();
    this.application = value; this.service = ''; this.partition = ''; this.services = []; this.partitions = []; this.error = '';
    this.loadingServices = false; this.loadingPartitions = false;
    if (!value) { return; }
    this.loadingServices = true;
    this.serviceRequest = this.rest.getServices(value).pipe(finalize(() => this.loadingServices = false)).subscribe({
      next: items => this.services = items.map(item => ({ id: item.Id, name: item.Name })), error: () => this.error = 'Could not load services.'
    });
  }
  chooseService(value: string) {
    this.partitionRequest?.unsubscribe(); this.service = value; this.partition = ''; this.partitions = []; this.error = '';
    this.loadingPartitions = false;
    if (!value) { return; }
    this.loadingPartitions = true;
    this.partitionRequest = this.rest.getPartitions(this.application, value).pipe(finalize(() => this.loadingPartitions = false)).subscribe({
      next: items => this.partitions = items.map(item => ({ id: item.PartitionInformation.Id, name: item.PartitionInformation.Id })),
      error: () => this.error = 'Could not load partitions.'
    });
  }
  retry() { if (this.service) { this.chooseService(this.service); } else if (this.application) { this.chooseApplication(this.application); } else { this.loadApplications(); } }
}
