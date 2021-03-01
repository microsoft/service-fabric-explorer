import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';
import { RepairTask } from '../repairTask';
import { DataModelCollectionBase } from './CollectionBase';

export class RepairTaskCollection extends DataModelCollectionBase<RepairTask> {
    repairTasks: RepairTask[] = [];
    completedRepairTasks: RepairTask[] = [];

    public constructor(data: DataService) {
        super(data, parent);
    }

    protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): Observable<any> {
        const dateRef = new Date();
        return this.data.restClient.getRepairTasks(messageHandler)
            .pipe(map(items => {
                return items.map(raw => new RepairTask(this.data, raw, dateRef));
            }));
    }

    protected updateInternal(): Observable<any> {
        this.repairTasks = [];
        this.completedRepairTasks = [];
        this.collection.forEach(task => {
            console.log(task)

            if (task.inProgress) {
                this.repairTasks.push(task);
              }else {
                this.completedRepairTasks.push(task);
              }
        });
        return of(null);
    }
}
