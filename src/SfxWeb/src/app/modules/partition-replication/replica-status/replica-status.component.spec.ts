import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplicaStatusComponent } from './replica-status.component';
import { IRemoteReplicatorAcknowledgementDetail } from 'src/app/Models/RawDataTypes';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ReplicaStatusComponent', () => {
  let component: ReplicaStatusComponent;
  let fixture: ComponentFixture<ReplicaStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReplicaStatusComponent ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplicaStatusComponent);
    component = fixture.componentInstance;

    component.replica = <any> {
      role: "test",
      raw : {
        NodeName: "node_1"
      }
    }
    component.replicator = {
      "ReplicaId": "932150691833444541",
      "LastAcknowledgementProcessedTimeUtc": "2020-02-14T05:28:58.161Z",
      "LastReceivedReplicationSequenceNumber": "80",
      "LastAppliedReplicationSequenceNumber": "80",
      "IsInBuild": false,
      "LastReceivedCopySequenceNumber": "0",
      "LastAppliedCopySequenceNumber": "0",
      "RemoteReplicatorAcknowledgementStatus": {
          "ReplicationStreamAcknowledgementDetail": {
              "AverageReceiveDuration": "0",
              "AverageApplyDuration": "0",
              "NotReceivedCount": "0",
              "ReceivedAndNotAppliedCount": "0"
          },
          "CopyStreamAcknowledgementDetail": {
              "AverageReceiveDuration": "0",
              "AverageApplyDuration": "0",
              "NotReceivedCount": "0",
              "ReceivedAndNotAppliedCount": "0"
          }
      }
  }
    fixture.detectChanges();
  });

  fit('should create', () => {
    expect(component).toBeTruthy();
  });

  fit('inBuild copy', () => {
    component.replicator.RemoteReplicatorAcknowledgementStatus.CopyStreamAcknowledgementDetail = {
      "AverageReceiveDuration": "0",
      "AverageApplyDuration": "0",
      "NotReceivedCount": "1",
      "ReceivedAndNotAppliedCount": "1"
    }
    component.replicator.IsInBuild = true;
    component.ngOnChanges();
    expect(component.isCopying).toBeTruthy();
    expect(component.isReplicating).toBeFalsy();
    expect(component.overallStatus).toBe("Copying");
    expect(component.stepsFinished).toBe(0);
    expect(component.leftBannerColor).toBe("blue-border");
  });

  fit('inBuild replicate', () => {
    component.replicator.RemoteReplicatorAcknowledgementStatus.ReplicationStreamAcknowledgementDetail = {
      "AverageReceiveDuration": "0",
      "AverageApplyDuration": "0",
      "NotReceivedCount": "1",
      "ReceivedAndNotAppliedCount": "1"
    }
    component.replicator.IsInBuild = true;

    component.ngOnChanges();
    expect(component.isCopying).toBeFalsy();
    expect(component.isReplicating).toBeTruthy();
    expect(component.overallStatus).toBe("Replicating");
    expect(component.stepsFinished).toBe(1);
    expect(component.leftBannerColor).toBe("blue-border");
  });

  fit('active secondary', () => {
    component.ngOnChanges();
    expect(component.isCopying).toBeFalsy();
    expect(component.isReplicating).toBeFalsy();
    expect(component.overallStatus).toBe("Complete");
    expect(component.stepsFinished).toBe(2);
    expect(component.leftBannerColor).toBe("green-border");

    const header = fixture.nativeElement.querySelector('.replica-header');
    expect(header.children.item(0).textContent).toBe("ID : 932150691833444541");
    expect(header.children.item(1).textContent).toBe("LSN : 80 ");
    expect(header.children.item(2).textContent).toBe("Role : test ");
    expect(header.children.item(3).textContent).toBe("Node : node_1 ");
  });

  fit('estimate time', () => {
    const details: IRemoteReplicatorAcknowledgementDetail = {
      AverageApplyDuration: "100",
      AverageReceiveDuration: "100",
      NotReceivedCount: "100",
      ReceivedAndNotAppliedCount: "100"
    }
    expect(component.getEstimatedDuration(details)).toEqual("0.00:00:30.0");

    const details2: IRemoteReplicatorAcknowledgementDetail = {
      AverageApplyDuration: "1500",
      AverageReceiveDuration: "100",
      NotReceivedCount: "200",
      ReceivedAndNotAppliedCount: "100"
    }
    expect(component.getEstimatedDuration(details2)).toEqual("0.00:07:50.0");
  });

});
