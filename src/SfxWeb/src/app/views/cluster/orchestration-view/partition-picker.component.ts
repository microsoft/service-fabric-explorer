import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, OnDestroy, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { RestClientService } from 'src/app/services/rest-client.service';

interface PartitionChoice { id: string; name: string; }

@Component({
  selector: 'app-partition-picker', standalone: true, imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<div class="partition-picker">
    <div class="choices">
      <label>Application<select aria-label="Partition application" [ngModel]="application" (ngModelChange)="chooseApplication($event)" [disabled]="loadingApplications"><option value="">Choose an application</option>@for (item of applications; track item.id) { <option [value]="item.id">{{item.name}}</option> }</select></label>
      <label [class.unavailable]="!application || loadingServices">Service<select aria-label="Partition service" [ngModel]="service" (ngModelChange)="chooseService($event)" [disabled]="!application || loadingServices"><option value="">{{!application ? 'Select an application first' : loadingServices ? 'Loading services...' : 'Choose a service'}}</option>@for (item of services; track item.id) { <option [value]="item.id">{{item.name}}</option> }</select></label>
      <label [class.unavailable]="!service || loadingPartitions">Partition<select aria-label="Choose partition" [(ngModel)]="partition" [disabled]="!service || loadingPartitions"><option value="">{{!service ? 'Select a service first' : loadingPartitions ? 'Loading partitions...' : 'Choose a partition'}}</option>@for (item of partitions; track item.id) { <option [value]="item.id">{{item.name}}</option> }</select></label>
    </div>
    @if (loadingApplications || loadingServices || loadingPartitions) { <p role="status">Loading {{loadingApplications ? 'applications' : loadingServices ? 'services' : 'partitions'}}...</p> }
    @else if (error) { <p role="alert">{{error}} <button type="button" class="retry" (click)="retry()">Retry</button></p> }
    @else if (service && !partitions.length) { <p role="status">No partitions were returned for this service. You can enter a partition ID instead.</p> }
    @else if (application && !services.length) { <p role="status">No services were returned for this application.</p> }
    <button type="button" class="load" [disabled]="!partition || loadingPartitions" (click)="partitionChosen.emit(partition)">Load operations</button>
  </div>`,
   styles: [`.partition-picker{width:100%;max-width:520px}.choices{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}.choices label{display:grid;gap:6px;font-size:15px;min-width:0}select{box-sizing:border-box;width:100%;min-width:0;background:#0d1117;color:#e6edf3;border:1px solid #484f58;border-radius:5px;padding:8px;font-size:15px}p{font-size:15px;color:#8b949e;margin:12px 0}button{font-size:15px;cursor:pointer}.load{background:#238636;color:#fff;border:1px solid #2ea043;padding:8px 14px;border-radius:5px;margin-top:16px}.load:disabled{opacity:.5;cursor:default}.retry{color:#58a6ff;background:transparent;border:0}button:focus-visible,select:focus-visible{outline:2px solid #58a6ff;outline-offset:2px}`]
})
export class PartitionPickerComponent implements OnInit, OnDestroy {
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
    if (!value) { return; }
    this.loadingServices = true;
    this.serviceRequest = this.rest.getServices(value).pipe(finalize(() => this.loadingServices = false)).subscribe({
      next: items => this.services = items.map(item => ({ id: item.Id, name: item.Name })), error: () => this.error = 'Could not load services.'
    });
  }
  chooseService(value: string) {
    this.partitionRequest?.unsubscribe(); this.service = value; this.partition = ''; this.partitions = []; this.error = '';
    if (!value) { return; }
    this.loadingPartitions = true;
    this.partitionRequest = this.rest.getPartitions(this.application, value).pipe(finalize(() => this.loadingPartitions = false)).subscribe({
      next: items => this.partitions = items.map(item => ({ id: item.PartitionInformation.Id, name: item.PartitionInformation.Id })),
      error: () => this.error = 'Could not load partitions.'
    });
  }
  retry() { if (this.service) { this.chooseService(this.service); } else if (this.application) { this.chooseApplication(this.application); } else { this.loadApplications(); } }
}
