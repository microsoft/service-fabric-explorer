import { IEventStoreData } from "./event-store/event-store.component";
import {EventEmitter} from '@angular/core'
import { ListColumnSetting } from "src/app/Models/ListSettings";

export interface EventColumnUpdate {
    columnSetting: ListColumnSetting;
    listName: string;
    isSecondRow: boolean;
    isExisting: boolean;
    index?: number
}

export interface VisUpdateData {
    listEventStoreData: IEventStoreData<any, any>[];
    startDate: Date;
    endDate: Date;
}
export interface VisualizationComponent {
    update(data: VisUpdateData);
    selectEvent?: EventEmitter<any>;
    updateColumn?: EventEmitter<EventColumnUpdate>;
}