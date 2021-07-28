import { IRawInfrastructureJob, IRawInfraRepairTask, IRawRoleInstaceImpact } from '../RawDataTypes';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { DataModelBase } from './Base';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { StatusWarningLevel } from 'src/app/Common/Constants';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';

export class InfrastructureJob extends DataModelBase<IRawInfrastructureJob> {
    
    IsActive : string;
    ImpactAction:string;
    JobStatus: string;
    ImpactStep: string;
    AcknowlegementStatus: string;
    ActionStatus: string;
    DeadlineforResponse: string;
    CurrentUD: string;
    CurrentlyImpactedRoleInstances: IRawRoleInstaceImpact[];
    RepairTasks: IRawInfraRepairTask[];
    Id: string;

   public get id(): string {
       return this.raw.Id;
   }

   constructor(public dataService: DataService, public raw: IRawInfrastructureJob, private dateRef: Date = new Date()) {
       super(dataService, raw);
       this.updateInternal();
   }

   updateInternal(): Observable<any> {
    this.Id = this.raw.Id;
    this.IsActive = this.raw.IsActive;
    this.ImpactAction = this.raw.ImpactAction; 
    this.ImpactStep = this.raw.ImpactStep; 
    this.AcknowlegementStatus = this.raw.AcknowledgementStatus;
    this.ActionStatus = this.raw.ActionStatus;
    this.DeadlineforResponse = this.raw.DeadlineforResponse; 
    this.CurrentUD = this.raw.CurrentUD; 
    this.CurrentlyImpactedRoleInstances = this.raw.CurrentlyImpactedRoleInstances;
    this.RepairTasks = this.raw.RepairTasks;
    return of(null);
}
}