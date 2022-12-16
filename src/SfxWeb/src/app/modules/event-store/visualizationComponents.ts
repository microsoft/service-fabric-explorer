import { IEventStoreData } from "./event-store/event-store.component";
import {EventEmitter} from '@angular/core'
export interface VisualizationComponent {
    update();
    listEventStoreData: IEventStoreData<any, any>[];
    startDate?: Date;
    endDate?: Date;
    selectEvent?: EventEmitter<any>;
}