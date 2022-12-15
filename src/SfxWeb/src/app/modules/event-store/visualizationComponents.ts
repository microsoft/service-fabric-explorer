import { IEventStoreData } from "./event-store/event-store.component";

export interface VisualizationComponent {
    update();
    startDate: Date;
    endDate: Date;
    listEventStoreData: IEventStoreData<any, any>[];
}