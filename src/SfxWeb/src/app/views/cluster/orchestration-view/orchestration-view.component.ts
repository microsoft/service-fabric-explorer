import { AfterViewInit, ChangeDetectorRef, Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy } from "@angular/core";
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Router } from "@angular/router";
import { PartitionEventList } from "src/app/Models/DataModels/collections/Collections";
import { PartitionEvent } from "src/app/Models/eventstore/Events";
import {
  EventStoreUtils,
  ITimelineData,
  ITimelineItem,
} from "src/app/Models/eventstore/timelineGenerators";
import { IEventStoreData } from "src/app/modules/event-store/event-store/event-store.component";
import { IOnDateChange } from "src/app/modules/time-picker/double-slider/double-slider.component";
import { DataService } from "src/app/services/data.service";
import { TimeUtils } from "src/app/Utils/TimeUtils";
import { DataSet } from "vis-data";
import { ExperienceService } from 'src/app/services/experience.service';

@Component({
    selector: "app-orchestration-view",
    templateUrl: "./orchestration-view.component.html",
    styleUrls: ["./orchestration-view.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class OrchestrationViewComponent implements OnInit, AfterViewInit, OnDestroy {
  public browsePartitions = true;
  public loadingOperations = false;
  public operationsError = '';
  private operationRequest?: Subscription;
  public choosePartition(id: string) { this.partitionId = id; this.search(true); }
  ngOnDestroy() { this.operationRequest?.unsubscribe(); }
  experience = inject(ExperienceService);
  private dataService = inject(DataService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  readonly Balancing = "Balancing";
  readonly Placement = "Placement";
  readonly ConstraintCheck = "ConstraintCheck";

  readonly balancingEventColor = "DodgerBlue";
  readonly placementEventColor = "MediumSeaGreen";
  readonly constraintCheckEventColor = "Orange";
  readonly otherEventColor = "Red";

  partitionEvents!: PartitionEvent[];
  partitionId!: string;
  selectedEvent?: PartitionEvent | null;

  dateMin!: Date;
  startDate!: Date;
  endDate!: Date;

  balancingToggle = true;
  placementToggle = true;
  constrainCheckToggle = true;
  otherToggle = true;

  timeLineEventsData?: ITimelineData | null;

  ngOnInit(): void {
    this.dataService.clusterManifest.ensureInitialized().subscribe(() => {
      if (!this.dataService.clusterManifest.isEventStoreEnabled) { this.router.navigate(["/"]); }
    });
  }

  ngAfterViewInit() {
    this.dataService.clusterManifest.ensureInitialized().subscribe(() => {
      this.dateMin = TimeUtils.AddDays(
        new Date(),
        -this.dataService.clusterManifest.eventStoreTimeRange
      );
      this.endDate = this.endDate || new Date();
      this.startDate = this.startDate || new Date(Math.max(+this.dateMin, +this.endDate - 7 * 86400000));
      this.cdr.detectChanges();
    });
  }

  setDate(newDate: IOnDateChange) {
    this.endDate = newDate.endDate;
    this.startDate = newDate.startDate;
    this.search();
  }

  updateBalancingToggle(enabled: boolean) {
    this.balancingToggle = enabled;
    this.search();
  }

  updatePlacementToggle(enabled: boolean) {
    this.placementToggle = enabled;
    this.search();
  }

  updateConstrantCheckToggle(enabled: boolean) {
    this.constrainCheckToggle = enabled;
    this.search();
  }

  updateOtherToggle(enabled: boolean) {
    this.otherToggle = enabled;
    this.search();
  }

  search(shouldResetTimelineData: boolean = false) {
    this.operationRequest?.unsubscribe();
    this.operationsError = '';
    this.selectedEvent = null;
    this.cdr.detectChanges();
    if (shouldResetTimelineData) {
      this.timeLineEventsData = null;
    }
    if (!this.partitionId) {
      return;
    }
    if (this.experience.isNew() && !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(this.partitionId.trim())) {
      this.operationsError = 'Enter a valid partition ID (GUID).';
      return;
    }
    if (!this.startDate || !this.endDate) { return; }
    this.partitionId = this.partitionId.trim();
    this.loadingOperations = true;

    const partitionEventData = this.dataService.getPartitionEventData(this.partitionId);
    partitionEventData.eventsList.setEventFilter(["Operation"]);
    partitionEventData.setDateWindow!(this.startDate, this.endDate);
    this.operationRequest = partitionEventData.eventsList.refresh().pipe(finalize(() => this.loadingOperations = false)).subscribe((success) => {
      if (!success) {
        this.operationsError = 'Could not load operations for this partition. Check the ID and try again.';
        return;
      }
      this.fillInOperationEventsData(partitionEventData);
    });
  }

  selectEvent(index: string) {
    this.selectedEvent = this.partitionEvents[+index];
  }

  private fillInOperationEventsData(partitionEventData: IEventStoreData<PartitionEventList, PartitionEvent>) {
    this.partitionEvents = partitionEventData.getEvents!().filter((event) => this.shouldIncludeEvent(event));
    this.addNodeNames();
    const items = this.generateTimelineItems();
    this.timeLineEventsData = {
      start: this.startDate,
      end: this.endDate,
      items,
      allowClustering: true,
    };
  }

  private shouldIncludeEvent(event: PartitionEvent): boolean {
    const stage = event.raw["Stage"];
    return (stage == this.Balancing && this.balancingToggle) ||
      (stage == this.Placement && this.placementToggle) ||
      (stage == this.ConstraintCheck && this.constrainCheckToggle) ||
      (stage != this.Balancing && stage != this.Placement && stage != this.ConstraintCheck && this.otherToggle);
  }

  private addNodeNames() {
    const idToNameMap = new Map<string, string>(
      this.dataService.nodes.collection.map(node => [node.raw['Id']['Id'], node.raw['Name']])
    );
    this.partitionEvents.forEach(partition => {
      const raw = partition.raw;
      raw['SourceNodeName'] = raw['SourceNode'] ? idToNameMap.get(raw['SourceNode']) ?? null : null;
      raw['TargetNodeName'] = raw['TargetNode'] ? idToNameMap.get(raw['TargetNode']) ?? null : null;
    });
  }

  private generateTimelineItems(): DataSet<ITimelineItem> {
    const items = new DataSet<ITimelineItem>();
    this.partitionEvents.forEach((event, index) => {
      items.add({
        id: index,
        content: '',
        start: event.timeStamp,
        kind: event.kind,
        type: 'point',
        title: EventStoreUtils.tooltipFormat(event.eventProperties, event.timeStamp),
        className: 'hidden-dot',
        style: `border-color: ${this.getColorBySchedulerStage(event.raw["Stage"])};
                border-width: 10px;
                border-style: solid;
                border-radius: 20px;
                width: 0;
                height: 0;`
      });
    });
    return items;
  }

  private getColorBySchedulerStage(schedulerStage: string): string {
    switch (schedulerStage) {
      case this.Balancing:
        return this.balancingEventColor;
      case this.Placement:
        return this.placementEventColor;
      case this.ConstraintCheck:
        return this.constraintCheckEventColor;
      default:
        return this.otherEventColor;
    }
  }
}
