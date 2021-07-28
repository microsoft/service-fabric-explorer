import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { IRawSafetyCheckDescription } from 'src/app/Models/RawDataTypes';
import { RestClientService } from 'src/app/services/rest-client.service';
import { IPartitionData } from '../partition-info/partition-info.component';
import { MessageService, MessageSeverity } from 'src/app/services/message.service';

@Component({
  selector: 'app-safety-checks',
  templateUrl: './safety-checks.component.html',
  styleUrls: ['./safety-checks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SafetyChecksComponent implements OnChanges {

  @Input() safetyChecks: IRawSafetyCheckDescription[];
  // This can be provided to share a cache between safety check components
  @Input() partitions: Record<string, IPartitionData> = {};
  


  constructor(private restClientService: RestClientService,
              private cdr: ChangeDetectorRef,
              private messageService: MessageService) { }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(this)

    this.safetyChecks.forEach(check => {
      console.log(check)

      if(check.SafetyCheck.PartitionId && !this.partitions[check.SafetyCheck.PartitionId]) {
        this.getPartitionInfo(check.SafetyCheck.PartitionId);
      }
    })
  }

  async getPartitionInfo(id: string) {
    try {
      this.partitions[id] = {
        serviceName: null,
        applicationName: null,
        partition: null,
        loading: "inflight"
      };

      const partition = await this.restClientService.getPartitionById(id).toPromise();
      const serviceName = await this.restClientService.getServiceNameInfo(id).toPromise();
      const applicationName = await this.restClientService.getApplicationNameInfo(serviceName.Id).toPromise();

      this.partitions[id] = {
        serviceName,
        applicationName,
        partition,
        loading: "loaded"
      };

      console.log(this)
    } catch {
      this.messageService.showMessage('There was an issue getting partition info', MessageSeverity.Err);
      this.partitions[id] = {
        serviceName: null,
        applicationName: null,
        partition: null,
        loading: "failed"
      };
    }

    this.cdr.detectChanges();
  }

  safetyCheck(index, safetyCheck: IRawSafetyCheckDescription) {
    return safetyCheck.SafetyCheck.PartitionId || safetyCheck.SafetyCheck.Kind;
  }

}
