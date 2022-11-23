import { NotificationTypes } from "./notificationManager";

export interface ILogger {
    log: (level: NotificationTypes, message: string) => void;
}

export class Logger implements ILogger {
    public logFile = "./logs.txt";

    constructor() {

    }

    log(level: NotificationTypes, message: string) {
        console.log(`${level} - ${message} - ${new Date().toISOString()}`)
    }
}