import { IRawInfrastructureJob, IRawInfraRepairTask, IRawRoleInstaceImpact } from '../RawDataTypes';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { DataModelBase } from './Base';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { StatusWarningLevel } from 'src/app/Common/Constants';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';

export class InfrastructureJob extends DataModelBase<IRawInfrastructureJob> {
    
    ImpactStep: string;
    DeadlineforResponse: string;
    CurrentUD: string;
    CurrentlyImpactedRoleInstances: IRawRoleInstaceImpact[];
    RepairTasks: IRawInfraRepairTask[];
    Id: string;
    ServiceName: string;
    ImpactAction:string;
    AcknowlegementStatus: string;

   public get id(): string {
       return this.raw.Id;
   }

   constructor(infraServiceName: string , public dataService: DataService, public raw: IRawInfrastructureJob, private dateRef: Date = new Date()) {
       super(dataService, raw);
       this.ServiceName = infraServiceName;
       this.updateInternal();
   }

   updateInternal(): Observable<any> {
    this.Id = this.raw.Id;
    this.ImpactAction = this.raw.ImpactAction; 
    this.ImpactStep = this.raw.ImpactStep; 
    this.DeadlineforResponse = this.raw.DeadlineforResponse; 
    this.CurrentUD = this.raw.CurrentUD; 
    this.CurrentlyImpactedRoleInstances = this.raw.CurrentlyImpactedRoleInstances;
    this.RepairTasks = this.raw.RepairTasks;
    this.AcknowlegementStatus = this.raw.AcknowledgementStatus;
    return of(null);
}
}