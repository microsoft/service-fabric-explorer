module Sfx {

    export interface IStatusWarning {
        message: string;
        link?: string;
        linkText?: string;
        level: string;
        priority: number;
        id: string;
    }

    export class StatusWarningService {
        notifications: IStatusWarning[] = [];

        constructor() {}

        public addNotification(notification: IStatusWarning) {
            this.notifications.push(notification);
            this.notifications.sort((a, b) => a.priority > b.priority ? -1 : 1);
        }

        public getIndex(notificationId: string): number {
            let index = -1;
            for (let i = 0; i < this.notifications.length; i++) {
                if (this.notifications[i].id === notificationId) {
                    index = i;
                }
            }
            return index;
        }

        public addOrUpdateNotification(notification: IStatusWarning) {
            let index = this.getIndex(notification.id);
            if (index > -1){
                this.notifications[index] = notification;
            }else {
                this.notifications.push(notification);
            }
            this.notifications.sort((a, b) => a.priority > b.priority ? -1 : 1);
        }

        public removeNotificationById(notificationId: string) {
            let index = this.getIndex(notificationId);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }
    }

    (function () {

        let module = angular.module("StatusWarningService", []);
        module.factory("warnings", [ () => new StatusWarningService()]);

    })();
}
