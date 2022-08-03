import { IRawInfrastructureJob, IRawInfraRepairTask, IRawRoleInstanceImpact, InfraRepairTask } from '../RawDataTypes';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { DataModelBase } from './Base';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { StatusWarningLevel } from 'src/app/Common/Constants';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';

export class InfrastructureJob extends DataModelBase<IRawInfrastructureJob> {

    Id: string;
    RepairTask: InfraRepairTask;
    VmImpact: string[];
    NodeImpact: string[];

   public get id(): string {
       return this.raw.Id;
   }

   constructor(public dataService: DataService, public raw: IRawInfrastructureJob, private dateRef: Date = new Date()) {
       super(dataService, raw);
       this.updateInternal();
   }

   updateInternal() {
       this.RepairTask = this.raw.RepairTasks.length !== 0 ?  new InfraRepairTask(this.raw.RepairTasks[0].TaskId, this.raw.RepairTasks[0].State) : new InfraRepairTask('None', 'None');
       const repairTaskActual = this.data.repairCollection.collection.find(rt => rt.id === this.RepairTask.TaskId);
       this.VmImpact = [];
       this.NodeImpact = [];
       if (repairTaskActual != null && repairTaskActual.raw.Impact !== null)
       {
           repairTaskActual.raw.Impact.NodeImpactList.forEach(nt => this.NodeImpact.push(nt.NodeName + ':' + nt.ImpactLevel) );
       }
       if (this.RepairTask.State === 'Approved' || this.RepairTask.State === 'Executing' || this.RepairTask.State === 'Completed')
       {
           this.raw.AcknowledgementStatus = 'Acknowledged';
       }
       this.raw.CurrentlyImpactedRoleInstances.forEach( nodeimpact => this.VmImpact.push(nodeimpact.Name + ':' + nodeimpact.ImpactTypes.toString()) );
       return of(null);
   }
}
