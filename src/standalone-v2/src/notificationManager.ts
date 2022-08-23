import { Subject } from 'rxjs';

export enum NotificationTypes {
    Info = "Info",
    Warning = "Info",
    Error = "Error"
}

export interface INotification {
    message: string;
    level: NotificationTypes
    timestamp: Date;
}

export class NotificationManager {
    observable = new Subject<INotification>();
    notifications: INotification[] = [];
    constructor() {

    }

    emitMessage(level: NotificationTypes, message: string) {
        const event = {
            level,
            message,
            timestamp: new Date()
        };
        this.observable.next(event)
        this.notifications.push(event);
    }
}