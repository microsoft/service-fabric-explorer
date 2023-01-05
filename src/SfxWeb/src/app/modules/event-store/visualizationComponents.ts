import { IEventStoreData } from "./event-store/event-store.component";
import {EventEmitter} from '@angular/core'
import { ListColumnSetting } from "src/app/Models/ListSettings";

export interface EventColumnUpdate {
    columnSetting: ListColumnSetting;
    isSecondRow: boolean;
}

export interface VisualizationComponent {
    update();
    listEventStoreData: IEventStoreData<any, any>[];
    startDate?: Date;
    endDate?: Date;
    selectEvent?: EventEmitter<any>;
    updateColumn?: EventEmitter<EventColumnUpdate>;
}