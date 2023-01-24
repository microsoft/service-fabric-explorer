import { IEventStoreData } from "./event-store/event-store.component";
import {EventEmitter} from '@angular/core'
import { ListColumnSetting } from "src/app/Models/ListSettings";

export interface IEventColumnUpdate {
    columnSetting: ListColumnSetting;
    listName: string;
    isSecondRow: boolean;
    index?: number
}


export interface IVisUpdateData {
    listEventStoreData: IEventStoreData<any, any>[];
    startDate: Date;
    endDate: Date;
}
export interface VisualizationComponent {
    update(data: IVisUpdateData);
    selectEvent?: EventEmitter<any>;
    updateColumn?: EventEmitter<IEventColumnUpdate>;
}