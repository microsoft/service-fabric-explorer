import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

export interface IStatusWarning {
    message: string;
    link?: string;
    linkText?: string;
    level: string;
    priority: number;
    id: string;
    confirmText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StatusWarningService {

  notifications: IStatusWarning[] = [];

  constructor(public storage: StorageService) {
  }

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
      const canBeShown = this.storage.getValueBoolean(this.getStorageId(notification.id), true);

      if (canBeShown) {
          const index = this.getIndex(notification.id);
          if (index > -1) {
              this.notifications[index] = notification;
          }else {
              this.notifications.push(notification);
          }
          this.notifications.sort((a, b) => a.priority > b.priority ? -1 : 1);
      }
  }

  // hidePermanently will store the id in local storage so that it does not get put in the drop down again.
  public removeNotificationById(notificationId: string, hidePermanently = false) {
      const index = this.getIndex(notificationId);
      if (index > -1) {
          this.notifications.splice(index, 1);
      }

      if (hidePermanently) {
          this.storage.setValue(this.getStorageId(notificationId), false);
      }
  }

  private getStorageId(notificationId: string): string {
      return `sfx-statuswarning-${notificationId}-noshow`;
  }
}
